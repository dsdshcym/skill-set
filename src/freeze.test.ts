import { describe, it, expect, afterEach } from "bun:test";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import { $ } from "bun";
import { setupInstalledRepo } from "./test-helpers";
import { freeze } from "./freeze";
import { readLockfile } from "./lock";

describe("freeze", () => {
  let tmpDir: string;

  afterEach(async () => { await rm(tmpDir, { recursive: true }); });

  it("writes current HEAD of each skill to Skillfile.lock", async () => {
    const { tmpDir: td, originRepo, claudeDir } = await setupInstalledRepo();
    tmpDir = td;
    const cloneDir = join(claudeDir, "skill-repos", "origin");
    const expectedPin = (await $`git -C ${cloneDir} rev-parse HEAD`.quiet()).stdout.toString().trim();

    await freeze([{ name: "my-skill", origin: originRepo, path: ".claude/skills/my-skill" }], claudeDir);

    const pins = await readLockfile(join(claudeDir, "Skillfile.lock"));
    expect(pins["my-skill"]).toBe(expectedPin);
  });

  it("overwrites existing Skillfile.lock", async () => {
    const { tmpDir: td, originRepo, claudeDir } = await setupInstalledRepo();
    tmpDir = td;
    const skills = [{ name: "my-skill", origin: originRepo, path: ".claude/skills/my-skill" }];

    await freeze(skills, claudeDir);
    await freeze(skills, claudeDir);

    const pins = await readLockfile(join(claudeDir, "Skillfile.lock"));
    expect(Object.keys(pins)).toHaveLength(1);
  });
});
