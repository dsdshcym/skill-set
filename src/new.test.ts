import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { $ } from "bun";
import { newSkill } from "./new";
import { install } from "./install";

describe("newSkill", () => {
  let tmpDir: string;
  let claudeDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "skill-set-test-"));
    claudeDir = join(tmpDir, ".claude");
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true });
  });

  describe("standalone mode", () => {
    it("creates a git repo with SKILL.md at skill-repos/<name>/", async () => {
      const result = await newSkill("my-skill", undefined, { skills: [], skillsets: [] }, claudeDir);

      const skillDir = join(claudeDir, "skill-repos", "my-skill");
      expect(result).toBe(skillDir);

      // Should be a git repo
      const gitDir = await Bun.file(join(skillDir, ".git")).exists();
      const { exitCode } = await $`git -C ${skillDir} rev-parse --git-dir`.quiet().nothrow();
      expect(exitCode).toBe(0);

      // Should have SKILL.md with pre-filled name
      const skillMd = await Bun.file(join(skillDir, "SKILL.md")).text();
      expect(skillMd).toContain("name: my-skill");
      expect(skillMd).toContain("description:");
    });

    it("errors when directory already exists", async () => {
      const skillDir = join(claudeDir, "skill-repos", "my-skill");
      await mkdir(skillDir, { recursive: true });

      expect(
        newSkill("my-skill", undefined, { skills: [], skillsets: [] }, claudeDir)
      ).rejects.toThrow();
    });
  });

  describe("skillset mode", () => {
    let originRepo: string;

    beforeEach(async () => {
      // Create an origin repo that looks like a skillset
      originRepo = join(tmpDir, "origin");
      await mkdir(join(originRepo, "skills/existing-skill"), { recursive: true });
      await Bun.write(join(originRepo, "skills/existing-skill/SKILL.md"), "# Existing");
      await $`git init ${originRepo}`.quiet();
      await $`git -C ${originRepo} config user.email "test@test.com"`.quiet();
      await $`git -C ${originRepo} config user.name "Test"`.quiet();
      await $`git -C ${originRepo} config commit.gpgsign false`.quiet();
      await $`git -C ${originRepo} add .`.quiet();
      await $`git -C ${originRepo} commit -m "init"`.quiet();

      // Install the skillset so it exists in skill-repos
      await install({
        skills: [],
        skillsets: [{
          name: "my-set",
          origin: originRepo,
          root_path: "skills",
          skills: ["existing-skill"],
        }],
      }, claudeDir);
    });

    it("creates SKILL.md under skillset's root_path", async () => {
      const data = {
        skills: [],
        skillsets: [{
          name: "my-set",
          origin: originRepo,
          root_path: "skills",
          skills: ["existing-skill"],
        }],
      };

      const result = await newSkill("brand-new", "my-set", data, claudeDir);

      const expectedDir = join(claudeDir, "skill-repos", "my-set", "skills", "brand-new");
      expect(result).toBe(expectedDir);

      const skillMd = await Bun.file(join(expectedDir, "SKILL.md")).text();
      expect(skillMd).toContain("name: brand-new");
      expect(skillMd).toContain("description:");
    });

    it("works with empty root_path", async () => {
      // Install a skillset with empty root_path
      const rootOrigin = join(tmpDir, "root-origin");
      await mkdir(join(rootOrigin, "existing"), { recursive: true });
      await Bun.write(join(rootOrigin, "existing/SKILL.md"), "# Existing");
      await $`git init ${rootOrigin}`.quiet();
      await $`git -C ${rootOrigin} config user.email "test@test.com"`.quiet();
      await $`git -C ${rootOrigin} config user.name "Test"`.quiet();
      await $`git -C ${rootOrigin} config commit.gpgsign false`.quiet();
      await $`git -C ${rootOrigin} add .`.quiet();
      await $`git -C ${rootOrigin} commit -m "init"`.quiet();

      await install({
        skills: [],
        skillsets: [{
          name: "root-set",
          origin: rootOrigin,
          root_path: "",
          skills: ["existing"],
        }],
      }, claudeDir);

      const data = {
        skills: [],
        skillsets: [{
          name: "root-set",
          origin: rootOrigin,
          root_path: "",
          skills: ["existing"],
        }],
      };

      const result = await newSkill("new-one", "root-set", data, claudeDir);

      const expectedDir = join(claudeDir, "skill-repos", "root-set", "new-one");
      expect(result).toBe(expectedDir);
      expect(await Bun.file(join(expectedDir, "SKILL.md")).exists()).toBe(true);
    });

    it("errors when skillset directory already exists", async () => {
      const data = {
        skills: [],
        skillsets: [{
          name: "my-set",
          origin: originRepo,
          root_path: "skills",
          skills: ["existing-skill"],
        }],
      };

      // existing-skill dir already exists from install
      expect(
        newSkill("existing-skill", "my-set", data, claudeDir)
      ).rejects.toThrow();
    });

    it("errors when skillset is not found in Skillfile", async () => {
      expect(
        newSkill("brand-new", "nonexistent", { skills: [], skillsets: [] }, claudeDir)
      ).rejects.toThrow("nonexistent");
    });

    it("errors when skillset is not installed", async () => {
      const data = {
        skills: [],
        skillsets: [{
          name: "not-installed",
          origin: "https://example.com/repo.git",
          root_path: "skills",
          skills: ["some-skill"],
        }],
      };

      expect(
        newSkill("brand-new", "not-installed", data, claudeDir)
      ).rejects.toThrow();
    });
  });
});
