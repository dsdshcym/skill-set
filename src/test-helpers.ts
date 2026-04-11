import { mkdtemp, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { $ } from "bun";
import { install } from "./install";

export async function setupTestRepo() {
  const tmpDir = await mkdtemp(join(tmpdir(), "skill-set-test-"));
  const originRepo = join(tmpDir, "origin");
  const claudeDir = join(tmpDir, ".claude");

  await mkdir(join(originRepo, ".claude/skills/my-skill"), { recursive: true });
  await Bun.write(join(originRepo, ".claude/skills/my-skill/SKILL.md"), "# My Skill");
  await $`git init ${originRepo}`.quiet();
  await $`git -C ${originRepo} config user.email "test@test.com"`.quiet();
  await $`git -C ${originRepo} config user.name "Test"`.quiet();
  await $`git -C ${originRepo} config commit.gpgsign false`.quiet();
  await $`git -C ${originRepo} add .`.quiet();
  await $`git -C ${originRepo} commit -m "init"`.quiet();

  return { tmpDir, originRepo, claudeDir };
}

export async function setupInstalledRepo() {
  const env = await setupTestRepo();
  await install(
    [{ name: "my-skill", origin: env.originRepo, path: ".claude/skills/my-skill" }],
    env.claudeDir
  );
  return env;
}

export async function addCommit(repo: string, file: string, content: string) {
  await Bun.write(file, content);
  await $`git -C ${repo} add .`.quiet();
  await $`git -C ${repo} -c commit.gpgsign=false commit -m "update"`.quiet();
  return (await $`git -C ${repo} rev-parse HEAD`.quiet()).stdout.toString().trim();
}
