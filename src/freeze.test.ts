import { describe, it, expect, afterEach } from "bun:test";
import { rm, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { $ } from "bun";
import { setupInstalledRepo, setupTestRepo } from "./test-helpers";
import { freeze } from "./freeze";
import { readLockfile } from "./lock";
import { install } from "./install";

describe("freeze", () => {
  let tmpDir: string;

  afterEach(async () => { await rm(tmpDir, { recursive: true }); });

  it("writes current HEAD to Skillfile.lock", async () => {
    const { tmpDir: td, originRepo, claudeDir } = await setupInstalledRepo();
    tmpDir = td;
    const cloneDir = join(claudeDir, "skill-repos", "my-skill");
    const expectedPin = (await $`git -C ${cloneDir} rev-parse HEAD`.quiet()).stdout.toString().trim();

    await freeze(
      { skills: [{ name: "my-skill", origin: originRepo, path: ".claude/skills/my-skill" }], skillsets: [] },
      claudeDir
    );

    const locked = await readLockfile(join(claudeDir, "Skillfile.lock"));
    expect(locked).toHaveLength(1);
    expect(locked[0].name).toBe("my-skill");
    expect(locked[0].pin).toBe(expectedPin);
  });

  it("overwrites existing Skillfile.lock", async () => {
    const { tmpDir: td, originRepo, claudeDir } = await setupInstalledRepo();
    tmpDir = td;
    const data = { skills: [{ name: "my-skill", origin: originRepo, path: ".claude/skills/my-skill" }], skillsets: [] };

    await freeze(data, claudeDir);
    await freeze(data, claudeDir);

    const locked = await readLockfile(join(claudeDir, "Skillfile.lock"));
    expect(locked).toHaveLength(1);
  });

  it("shares one pin for skills in the same skillset", async () => {
    const { tmpDir: td, originRepo, claudeDir } = await setupTestRepo();
    tmpDir = td;

    await mkdir(join(originRepo, ".claude/skills/skill-b"), { recursive: true });
    await Bun.write(join(originRepo, ".claude/skills/skill-b/SKILL.md"), "# Skill B");
    await $`git -C ${originRepo} add .`.quiet();
    await $`git -C ${originRepo} -c commit.gpgsign=false commit -m "add skill-b"`.quiet();

    const data = {
      skills: [],
      skillsets: [{
        name: "my-set",
        origin: originRepo,
        root_path: ".claude/skills",
        skills: ["my-skill", "skill-b"],
      }],
    };
    await install(data, claudeDir);
    await freeze(data, claudeDir);

    const locked = await readLockfile(join(claudeDir, "Skillfile.lock"));
    expect(locked).toHaveLength(2);
    expect(locked[0].pin).toBe(locked[1].pin);
    expect(locked[0].skillset).toBe("my-set");
    expect(locked[1].skillset).toBe("my-set");
  });
});
