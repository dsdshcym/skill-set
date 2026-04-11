import { describe, it, expect, afterEach } from "bun:test";
import { rm, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { $ } from "bun";
import { setupInstalledRepo, setupTestRepo, addCommit } from "./test-helpers";
import { update } from "./update";
import { cloneDirName } from "./config";
import { readLockfile } from "./lock";
import { install } from "./install";
import { freeze } from "./freeze";

describe("update", () => {
  let tmpDir: string;

  afterEach(async () => { await rm(tmpDir, { recursive: true }); });

  it("fetches and merges new commits from upstream", async () => {
    const { tmpDir: td, originRepo, claudeDir } = await setupInstalledRepo();
    tmpDir = td;
    const newFile = join(originRepo, ".claude/skills/my-skill/new-file.md");
    await addCommit(originRepo, newFile, "new");

    const skills = [{ name: "my-skill", origin: originRepo, path: ".claude/skills/my-skill", skillset: "my-skill" }];
    await update("my-skill", skills, claudeDir);

    const cloneDir = join(claudeDir, "skill-repos", cloneDirName(skills[0]));
    expect(await Bun.file(join(cloneDir, ".claude/skills/my-skill/new-file.md")).exists()).toBe(true);
  });

  it("updates Skillfile.lock with the new HEAD for all skills in skillset", async () => {
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
    await freeze(skills, claudeDir);

    const newPin = await addCommit(originRepo, join(originRepo, "bump.md"), "bump");
    await update("my-set", skills, claudeDir);

    const locked = await readLockfile(join(claudeDir, "Skillfile.lock"));
    expect(locked).toHaveLength(2);
    expect(locked[0].pin).toBe(newPin);
    expect(locked[1].pin).toBe(newPin);
  });

  it("errors when skillset not found", async () => {
    const { tmpDir: td, claudeDir } = await setupInstalledRepo();
    tmpDir = td;
    const skills = [{ name: "my-skill", origin: "x", path: "x", skillset: "my-skill" }];

    expect(update("nonexistent", skills, claudeDir)).rejects.toThrow('"nonexistent" not found');
  });

  it("errors when given individual skill from multi-skill skillset", async () => {
    const { tmpDir: td, claudeDir } = await setupInstalledRepo();
    tmpDir = td;
    const skills = [
      { name: "skill-a", origin: "x", path: "x", skillset: "my-set" },
      { name: "skill-b", origin: "x", path: "x", skillset: "my-set" },
    ];

    expect(update("skill-a", skills, claudeDir)).rejects.toThrow('part of skillset "my-set"');
  });
});
