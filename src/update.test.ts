import { describe, it, expect, afterEach } from "bun:test";
import { rm, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { $ } from "bun";
import { setupInstalledRepo, setupTestRepo, addCommit } from "./test-helpers";
import { update } from "./update";
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

    const data = { skills: [{ name: "my-skill", origin: originRepo, path: ".claude/skills/my-skill" }], skillsets: [] };
    await update("my-skill", data, claudeDir);

    const cloneDir = join(claudeDir, "skill-repos", "my-skill");
    expect(await Bun.file(join(cloneDir, ".claude/skills/my-skill/new-file.md")).exists()).toBe(true);
  });

  it("updates Skillfile.lock for all skills in a skillset", async () => {
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

    const newPin = await addCommit(originRepo, join(originRepo, "bump.md"), "bump");
    await update("my-set", data, claudeDir);

    const locked = await readLockfile(join(claudeDir, "Skillfile.lock"));
    expect(locked).toHaveLength(2);
    expect(locked[0].pin).toBe(newPin);
    expect(locked[1].pin).toBe(newPin);
  });

  it("errors when name not found", async () => {
    const { tmpDir: td, claudeDir } = await setupInstalledRepo();
    tmpDir = td;

    expect(update("nonexistent", { skills: [], skillsets: [] }, claudeDir)).rejects.toThrow('"nonexistent" not found');
  });

  it("errors when given individual skill from multi-skill skillset", async () => {
    const { tmpDir: td, claudeDir } = await setupInstalledRepo();
    tmpDir = td;
    const data = {
      skills: [],
      skillsets: [{ name: "my-set", origin: "x", root_path: "x", skills: ["skill-a", "skill-b"] }],
    };

    expect(update("skill-a", data, claudeDir)).rejects.toThrow('part of skillset "my-set"');
  });
});
