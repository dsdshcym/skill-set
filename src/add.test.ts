import { describe, it, expect, afterEach } from "bun:test";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import { setupTestRepo } from "./test-helpers";
import { add } from "./add";
import { readSkillfile } from "./config";

describe("add", () => {
  let tmpDir: string;

  afterEach(async () => { await rm(tmpDir, { recursive: true }); });

  it("appends skill to Skillfile and installs it", async () => {
    const { tmpDir: td, originRepo, claudeDir } = await setupTestRepo();
    tmpDir = td;

    await add({ name: "my-skill", origin: originRepo, path: ".claude/skills/my-skill" }, claudeDir);

    const skills = await readSkillfile(join(claudeDir, "Skillfile"));
    expect(skills).toHaveLength(1);
    expect(skills[0].name).toBe("my-skill");
    expect(await Bun.file(join(claudeDir, "skills", "my-skill", "SKILL.md")).exists()).toBe(true);
  });

  it("appends to an existing Skillfile without overwriting", async () => {
    const { tmpDir: td, originRepo, claudeDir } = await setupTestRepo();
    tmpDir = td;

    await add({ name: "skill-a", origin: originRepo, path: ".claude/skills/my-skill" }, claudeDir);
    await add({ name: "skill-b", origin: originRepo, path: ".claude/skills/my-skill" }, claudeDir);

    const skills = await readSkillfile(join(claudeDir, "Skillfile"));
    expect(skills).toHaveLength(2);
    expect(skills[0].name).toBe("skill-a");
    expect(skills[1].name).toBe("skill-b");
  });
});
