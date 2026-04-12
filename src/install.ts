import { mkdir, symlink, rm } from "node:fs/promises";
import { join } from "node:path";
import { $ } from "bun";
import type { Skill, Skillset, SkillfileData } from "./config";

async function dirExists(path: string): Promise<boolean> {
  return Bun.file(join(path, ".git", "HEAD")).exists();
}

async function cloneOrFetch(cloneDir: string, origin: string, pin?: string): Promise<void> {
  if (await dirExists(cloneDir)) {
    await $`git -C ${cloneDir} fetch origin`.quiet();
    await $`git -C ${cloneDir} merge --ff-only FETCH_HEAD`.quiet();
  } else {
    await $`git clone ${origin} ${cloneDir}`.quiet();
  }
  if (pin) {
    await $`git -C ${cloneDir} checkout ${pin}`.quiet();
  }
}

async function createSymlink(skillsDir: string, name: string, target: string): Promise<void> {
  const linkPath = join(skillsDir, name);
  await rm(linkPath, { force: true });
  await symlink(target, linkPath);
}

export async function install(data: SkillfileData, claudeDir: string): Promise<void> {
  const reposDir = join(claudeDir, "skill-repos");
  const skillsDir = join(claudeDir, "skills");
  await mkdir(reposDir, { recursive: true });
  await mkdir(skillsDir, { recursive: true });

  // Install standalone skills
  for (const skill of data.skills) {
    const cloneDir = join(reposDir, skill.name);
    await cloneOrFetch(cloneDir, skill.origin, skill.pin);
    await createSymlink(skillsDir, skill.name, join(cloneDir, skill.path));
  }

  // Install skillsets
  for (const ss of data.skillsets) {
    const cloneDir = join(reposDir, ss.name);
    await cloneOrFetch(cloneDir, ss.origin, ss.pin);
    for (const skillName of ss.skills) {
      const path = ss.root_path ? `${ss.root_path}/${skillName}` : skillName;
      await createSymlink(skillsDir, skillName, join(cloneDir, path));
    }
  }
}
