import { mkdir, symlink, rm } from "node:fs/promises";
import { join, basename } from "node:path";
import { $ } from "bun";
import type { Skill } from "./config";

function repoName(origin: string): string {
  return basename(origin).replace(/\.git$/, "");
}

async function dirExists(path: string): Promise<boolean> {
  return Bun.file(join(path, ".git", "HEAD")).exists();
}

export async function install(skills: Skill[], claudeDir: string): Promise<void> {
  const reposDir = join(claudeDir, "skill-repos");
  const skillsDir = join(claudeDir, "skills");
  await mkdir(reposDir, { recursive: true });
  await mkdir(skillsDir, { recursive: true });

  for (const skill of skills) {
    const cloneDir = join(reposDir, repoName(skill.origin));

    if (await dirExists(cloneDir)) {
      await $`git -C ${cloneDir} fetch origin`.quiet();
      await $`git -C ${cloneDir} merge --ff-only FETCH_HEAD`.quiet();
    } else {
      await $`git clone ${skill.origin} ${cloneDir}`.quiet();
    }

    if (skill.pin) {
      await $`git -C ${cloneDir} checkout ${skill.pin}`.quiet();
    }

    const linkPath = join(skillsDir, skill.name);
    const linkTarget = join(cloneDir, skill.path);

    // Remove existing symlink if present before recreating
    await rm(linkPath, { force: true });
    await symlink(linkTarget, linkPath);
  }
}
