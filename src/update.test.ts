import { describe, it, expect, afterEach } from "bun:test";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import { setupInstalledRepo, addCommit } from "./test-helpers";
import { update } from "./update";
import { readLockfile } from "./lock";

describe("update", () => {
  let tmpDir: string;

  afterEach(async () => { await rm(tmpDir, { recursive: true }); });

  it("fetches and merges new commits from upstream", async () => {
    const { tmpDir: td, originRepo, claudeDir } = await setupInstalledRepo();
    tmpDir = td;
    const newFile = join(originRepo, ".claude/skills/my-skill/new-file.md");
    await addCommit(originRepo, newFile, "new");

    await update({ name: "my-skill", origin: originRepo, path: ".claude/skills/my-skill" }, claudeDir);

    const cloneDir = join(claudeDir, "skill-repos", "origin");
    expect(await Bun.file(join(cloneDir, ".claude/skills/my-skill/new-file.md")).exists()).toBe(true);
  });

  it("updates Skillfile.lock with the new HEAD", async () => {
    const { tmpDir: td, originRepo, claudeDir } = await setupInstalledRepo();
    tmpDir = td;
    const newPin = await addCommit(originRepo, join(originRepo, "bump.md"), "bump");

    await update({ name: "my-skill", origin: originRepo, path: ".claude/skills/my-skill" }, claudeDir);

    const pins = await readLockfile(join(claudeDir, "Skillfile.lock"));
    expect(pins["my-skill"]).toBe(newPin);
  });
});
