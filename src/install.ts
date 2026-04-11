import { mkdir, symlink, rm } from "node:fs/promises";
import { join } from "node:path";
import { $ } from "bun";
import { cloneDirName, type Skill } from "./config";

async function dirExists(path: string): Promise<boolean> {
  return Bun.file(join(path, ".git", "HEAD")).exists();
}

function groupBySkillset(skills: Skill[]): Map<string, Skill[]> {
  const groups = new Map<string, Skill[]>();
  for (const skill of skills) {
    const key = cloneDirName(skill);
    const group = groups.get(key) ?? [];
    group.push(skill);
    groups.set(key, group);
  }
  return groups;
}

export async function install(skills: Skill[], claudeDir: string): Promise<void> {
  const reposDir = join(claudeDir, "skill-repos");
  const skillsDir = join(claudeDir, "skills");
  await mkdir(reposDir, { recursive: true });
  await mkdir(skillsDir, { recursive: true });

  for (const [dirName, group] of groupBySkillset(skills)) {
    const cloneDir = join(reposDir, dirName);
    const first = group[0];

    if (await dirExists(cloneDir)) {
      await $`git -C ${cloneDir} fetch origin`.quiet();
      await $`git -C ${cloneDir} merge --ff-only FETCH_HEAD`.quiet();
    } else {
      await $`git clone ${first.origin} ${cloneDir}`.quiet();
    }

    if (first.pin) {
      await $`git -C ${cloneDir} checkout ${first.pin}`.quiet();
    }

    for (const skill of group) {
      const linkPath = join(skillsDir, skill.name);
      const linkTarget = join(cloneDir, skill.path);
      await rm(linkPath, { force: true });
      await symlink(linkTarget, linkPath);
    }
  }
}
