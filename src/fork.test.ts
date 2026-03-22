import { describe, it, expect, afterEach } from "bun:test";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import { $ } from "bun";
import { setupInstalledRepo } from "./test-helpers";
import { fork } from "./fork";
import { readSkillfile, cloneDirName } from "./config";

describe("fork", () => {
  let tmpDir: string;

  afterEach(async () => { await rm(tmpDir, { recursive: true }); });

  it("updates origin in Skillfile and git remote, then pushes", async () => {
    const { tmpDir: td, originRepo, claudeDir } = await setupInstalledRepo();
    tmpDir = td;

    // Create a bare fork repo seeded from origin
    const forkRepo = join(tmpDir, "fork.git");
    await $`git clone --bare ${originRepo} ${forkRepo}`.quiet();

    // Write a Skillfile referencing the installed skill
    await Bun.write(
      join(claudeDir, "Skillfile"),
      `[[skill]]\nname = "my-skill"\norigin = "${originRepo}"\npath = ".claude/skills/my-skill"\n`
    );

    await fork("my-skill", forkRepo, claudeDir);

    // Skillfile updated
    const skills = await readSkillfile(join(claudeDir, "Skillfile"));
    expect(skills[0].origin).toBe(forkRepo);

    // Git remote updated
    const skill = { name: "my-skill", origin: originRepo, path: ".claude/skills/my-skill" };
    const cloneDir = join(claudeDir, "skill-repos", cloneDirName(skill));
    const remote = (await $`git -C ${cloneDir} remote get-url origin`.quiet()).stdout.toString().trim();
    expect(remote).toBe(forkRepo);
  });

  it("throws when skill not found", async () => {
    const { tmpDir: td, claudeDir } = await setupInstalledRepo();
    tmpDir = td;
    await Bun.write(join(claudeDir, "Skillfile"), "");

    await expect(fork("nonexistent", "https://example.com/x", claudeDir)).rejects.toThrow("nonexistent");
  });
});
