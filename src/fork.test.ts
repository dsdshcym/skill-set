import { describe, it, expect, afterEach } from "bun:test";
import { rm, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { $ } from "bun";
import { setupInstalledRepo, setupTestRepo } from "./test-helpers";
import { fork } from "./fork";
import { readSkillfile, cloneDirName } from "./config";
import { install } from "./install";

describe("fork", () => {
  let tmpDir: string;

  afterEach(async () => { await rm(tmpDir, { recursive: true }); });

  it("updates origin in Skillfile and git remote, then pushes", async () => {
    const { tmpDir: td, originRepo, claudeDir } = await setupInstalledRepo();
    tmpDir = td;

    const forkRepo = join(tmpDir, "fork.git");
    await $`git clone --bare ${originRepo} ${forkRepo}`.quiet();

    await Bun.write(
      join(claudeDir, "Skillfile"),
      `[[skill]]\nname = "my-skill"\norigin = "${originRepo}"\npath = ".claude/skills/my-skill"\n`
    );

    await fork("my-skill", forkRepo, claudeDir);

    const skills = await readSkillfile(join(claudeDir, "Skillfile"));
    expect(skills[0].origin).toBe(forkRepo);

    const cloneDir = join(claudeDir, "skill-repos", cloneDirName(skills[0]));
    const remote = (await $`git -C ${cloneDir} remote get-url origin`.quiet()).stdout.toString().trim();
    expect(remote).toBe(forkRepo);
  });

  it("forks a multi-skill skillset", async () => {
    const { tmpDir: td, originRepo, claudeDir } = await setupTestRepo();
    tmpDir = td;

    await mkdir(join(originRepo, ".claude/skills/skill-b"), { recursive: true });
    await Bun.write(join(originRepo, ".claude/skills/skill-b/SKILL.md"), "# Skill B");
    await $`git -C ${originRepo} add .`.quiet();
    await $`git -C ${originRepo} -c commit.gpgsign=false commit -m "add skill-b"`.quiet();

    const skills = [
      { name: "my-skill", origin: originRepo, path: ".claude/skills/my-skill", skillset: "my-set" },
      { name: "skill-b", origin: originRepo, path: ".claude/skills/skill-b", skillset: "my-set" },
    ];
    await install(skills, claudeDir);

    await Bun.write(
      join(claudeDir, "Skillfile"),
      `[[skillset]]\nname = "my-set"\norigin = "${originRepo}"\nroot_path = ".claude/skills"\nskills = ["my-skill", "skill-b"]\n`
    );

    const forkRepo = join(tmpDir, "fork.git");
    await $`git clone --bare ${originRepo} ${forkRepo}`.quiet();

    await fork("my-set", forkRepo, claudeDir);

    const cloneDir = join(claudeDir, "skill-repos", "my-set");
    const remote = (await $`git -C ${cloneDir} remote get-url origin`.quiet()).stdout.toString().trim();
    expect(remote).toBe(forkRepo);
  });

  it("throws when skillset not found", async () => {
    const { tmpDir: td, claudeDir } = await setupInstalledRepo();
    tmpDir = td;
    await Bun.write(join(claudeDir, "Skillfile"), "");

    await expect(fork("nonexistent", "https://example.com/x", claudeDir)).rejects.toThrow("nonexistent");
  });

  it("errors when given individual skill from multi-skill skillset", async () => {
    const { tmpDir: td, originRepo, claudeDir } = await setupInstalledRepo();
    tmpDir = td;
    await Bun.write(
      join(claudeDir, "Skillfile"),
      `[[skillset]]\nname = "my-set"\norigin = "${originRepo}"\nroot_path = ".claude/skills"\nskills = ["skill-a", "skill-b"]\n`
    );

    await expect(fork("skill-a", "https://example.com/x", claudeDir)).rejects.toThrow('part of skillset "my-set"');
  });
});
