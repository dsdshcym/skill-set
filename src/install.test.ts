import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { readlink } from "node:fs/promises";
import { mkdtemp, rm, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { install } from "./install";
import { $ } from "bun";

describe("install", () => {
  let tmpDir: string;
  let originRepo: string;
  let claudeDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "skill-set-test-"));
    originRepo = join(tmpDir, "origin");
    claudeDir = join(tmpDir, ".claude");

    await mkdir(join(originRepo, ".claude/skills/my-skill"), { recursive: true });
    await Bun.write(join(originRepo, ".claude/skills/my-skill/SKILL.md"), "# My Skill");
    await $`git init ${originRepo}`.quiet();
    await $`git -C ${originRepo} config user.email "test@test.com"`.quiet();
    await $`git -C ${originRepo} config user.name "Test"`.quiet();
    await $`git -C ${originRepo} config commit.gpgsign false`.quiet();
    await $`git -C ${originRepo} add .`.quiet();
    await $`git -C ${originRepo} commit -m "init"`.quiet();
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true });
  });

  it("clones a standalone skill and creates symlink", async () => {
    await install(
      { skills: [{ name: "my-skill", origin: originRepo, path: ".claude/skills/my-skill" }], skillsets: [] },
      claudeDir
    );

    const cloneDir = join(claudeDir, "skill-repos", "my-skill");
    expect(await Bun.file(join(cloneDir, ".claude/skills/my-skill/SKILL.md")).exists()).toBe(true);

    const linkTarget = await readlink(join(claudeDir, "skills", "my-skill"));
    expect(linkTarget).toBe(join(cloneDir, ".claude/skills/my-skill"));
  });

  it("fetches instead of cloning when repo already cloned", async () => {
    const data = { skills: [{ name: "my-skill", origin: originRepo, path: ".claude/skills/my-skill" }], skillsets: [] };
    await install(data, claudeDir);

    await Bun.write(join(originRepo, ".claude/skills/my-skill/extra.md"), "extra");
    await $`git -C ${originRepo} add .`.quiet();
    await $`git -C ${originRepo} -c commit.gpgsign=false commit -m "add extra"`.quiet();

    await install(data, claudeDir);

    const cloneDir = join(claudeDir, "skill-repos", "my-skill");
    expect(await Bun.file(join(cloneDir, ".claude/skills/my-skill/extra.md")).exists()).toBe(true);
  });

  it("checks out pinned commit", async () => {
    const result = await $`git -C ${originRepo} rev-parse HEAD`.quiet();
    const pin = result.stdout.toString().trim();

    await Bun.write(join(originRepo, "after-pin.txt"), "new");
    await $`git -C ${originRepo} add .`.quiet();
    await $`git -C ${originRepo} -c commit.gpgsign=false commit -m "after pin"`.quiet();

    await install(
      { skills: [{ name: "my-skill", origin: originRepo, path: ".claude/skills/my-skill", pin }], skillsets: [] },
      claudeDir
    );

    const cloneDir = join(claudeDir, "skill-repos", "my-skill");
    const head = (await $`git -C ${cloneDir} rev-parse HEAD`.quiet()).stdout.toString().trim();
    expect(head).toBe(pin);
  });

  it("installs a skillset with shared clone and multiple symlinks", async () => {
    await mkdir(join(originRepo, ".claude/skills/skill-b"), { recursive: true });
    await Bun.write(join(originRepo, ".claude/skills/skill-b/SKILL.md"), "# Skill B");
    await $`git -C ${originRepo} add .`.quiet();
    await $`git -C ${originRepo} -c commit.gpgsign=false commit -m "add skill-b"`.quiet();

    await install({
      skills: [],
      skillsets: [{
        name: "my-set",
        origin: originRepo,
        root_path: ".claude/skills",
        skills: ["my-skill", "skill-b"],
      }],
    }, claudeDir);

    const sharedClone = join(claudeDir, "skill-repos", "my-set");
    const linkA = await readlink(join(claudeDir, "skills", "my-skill"));
    const linkB = await readlink(join(claudeDir, "skills", "skill-b"));

    expect(linkA).toBe(join(sharedClone, ".claude/skills/my-skill"));
    expect(linkB).toBe(join(sharedClone, ".claude/skills/skill-b"));

    expect(await Bun.file(join(sharedClone, ".claude/skills/my-skill/SKILL.md")).exists()).toBe(true);
    expect(await Bun.file(join(sharedClone, ".claude/skills/skill-b/SKILL.md")).exists()).toBe(true);

    const { stdout } = await $`ls ${join(claudeDir, "skill-repos")}`.quiet();
    expect(stdout.toString().trim().split("\n")).toEqual(["my-set"]);
  });

  it("installs a repo-root skill with empty path", async () => {
    await install(
      { skills: [{ name: "my-skill", origin: originRepo, path: "" }], skillsets: [] },
      claudeDir
    );

    const cloneDir = join(claudeDir, "skill-repos", "my-skill");
    const linkTarget = await readlink(join(claudeDir, "skills", "my-skill"));
    expect(linkTarget).toBe(cloneDir);
  });
});
