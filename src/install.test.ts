import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { readlink } from "node:fs/promises";
import { mkdtemp, rm, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { install } from "./install";
import { cloneDirName } from "./config";
import { $ } from "bun";

describe("install", () => {
  let tmpDir: string;
  let originRepo: string;
  let claudeDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "skill-set-test-"));
    originRepo = join(tmpDir, "origin");
    claudeDir = join(tmpDir, ".claude");

    // Set up a local git repo with a skill inside
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

  it("clones repo and creates symlink", async () => {
    const skill = { name: "my-skill", origin: originRepo, path: ".claude/skills/my-skill", skillset: "my-skill" };
    await install([skill], claudeDir);

    const cloneDir = join(claudeDir, "skill-repos", cloneDirName(skill));
    expect(await Bun.file(join(cloneDir, ".claude/skills/my-skill/SKILL.md")).exists()).toBe(true);

    const linkTarget = await readlink(join(claudeDir, "skills", "my-skill"));
    expect(linkTarget).toBe(join(cloneDir, ".claude/skills/my-skill"));
  });

  it("fetches instead of cloning when repo already cloned", async () => {
    const skill = { name: "my-skill", origin: originRepo, path: ".claude/skills/my-skill", skillset: "my-skill" };
    await install([skill], claudeDir);

    // Add a new commit to origin
    await Bun.write(join(originRepo, ".claude/skills/my-skill/extra.md"), "extra");
    await $`git -C ${originRepo} add .`.quiet();
    await $`git -C ${originRepo} -c commit.gpgsign=false commit -m "add extra"`.quiet();

    // Install again — should fetch and the new file should appear
    await install([skill], claudeDir);

    const cloneDir = join(claudeDir, "skill-repos", cloneDirName(skill));
    expect(await Bun.file(join(cloneDir, ".claude/skills/my-skill/extra.md")).exists()).toBe(true);
  });

  it("checks out pinned commit", async () => {
    const result = await $`git -C ${originRepo} rev-parse HEAD`.quiet();
    const pin = result.stdout.toString().trim();

    // Add a second commit
    await Bun.write(join(originRepo, "after-pin.txt"), "new");
    await $`git -C ${originRepo} add .`.quiet();
    await $`git -C ${originRepo} -c commit.gpgsign=false commit -m "after pin"`.quiet();

    const skill = { name: "my-skill", origin: originRepo, path: ".claude/skills/my-skill", pin, skillset: "my-skill" };
    await install([skill], claudeDir);

    const cloneDir = join(claudeDir, "skill-repos", cloneDirName(skill));
    const head = (await $`git -C ${cloneDir} rev-parse HEAD`.quiet()).stdout.toString().trim();
    expect(head).toBe(pin);
  });

  it("shares one clone for skills in the same skillset", async () => {
    // Create a repo with two skills
    await mkdir(join(originRepo, ".claude/skills/skill-b"), { recursive: true });
    await Bun.write(join(originRepo, ".claude/skills/skill-b/SKILL.md"), "# Skill B");
    await $`git -C ${originRepo} add .`.quiet();
    await $`git -C ${originRepo} -c commit.gpgsign=false commit -m "add skill-b"`.quiet();

    const skills = [
      { name: "my-skill", origin: originRepo, path: ".claude/skills/my-skill", skillset: "my-set" },
      { name: "skill-b", origin: originRepo, path: ".claude/skills/skill-b", skillset: "my-set" },
    ];
    await install(skills, claudeDir);

    // Both symlinks should point into the same clone dir
    const linkA = await readlink(join(claudeDir, "skills", "my-skill"));
    const linkB = await readlink(join(claudeDir, "skills", "skill-b"));
    const sharedClone = join(claudeDir, "skill-repos", "my-set");

    expect(linkA).toBe(join(sharedClone, ".claude/skills/my-skill"));
    expect(linkB).toBe(join(sharedClone, ".claude/skills/skill-b"));

    // Verify the shared clone exists and has both skills
    expect(await Bun.file(join(sharedClone, ".claude/skills/my-skill/SKILL.md")).exists()).toBe(true);
    expect(await Bun.file(join(sharedClone, ".claude/skills/skill-b/SKILL.md")).exists()).toBe(true);

    // Verify there's only one clone dir (not two)
    const { stdout } = await $`ls ${join(claudeDir, "skill-repos")}`.quiet();
    const dirs = stdout.toString().trim().split("\n");
    expect(dirs).toEqual(["my-set"]);
  });
});
