import { join } from "node:path";
import { exists, mkdir } from "node:fs/promises";
import { $ } from "bun";
import type { SkillfileData } from "./config";

const SKILL_TEMPLATE = (name: string) => `\
---
name: ${name}
description:
---

`;

export async function newSkill(
  name: string,
  inSkillset: string | undefined,
  data: SkillfileData,
  claudeDir: string
): Promise<string> {
  if (inSkillset) {
    return newSkillInSkillset(name, inSkillset, data, claudeDir);
  }
  return newStandaloneSkill(name, claudeDir);
}

async function newStandaloneSkill(name: string, claudeDir: string): Promise<string> {
  const skillDir = join(claudeDir, "skill-repos", name);

  if (await exists(skillDir)) {
    throw new Error(`Directory already exists: ${skillDir}`);
  }

  await mkdir(skillDir, { recursive: true });
  await $`git init ${skillDir}`.quiet();
  await Bun.write(join(skillDir, "SKILL.md"), SKILL_TEMPLATE(name));

  return skillDir;
}

async function newSkillInSkillset(
  name: string,
  skillsetName: string,
  data: SkillfileData,
  claudeDir: string
): Promise<string> {
  const skillset = data.skillsets.find((ss) => ss.name === skillsetName);
  if (!skillset) {
    throw new Error(`Skillset not found in Skillfile: ${skillsetName}`);
  }

  const cloneDir = join(claudeDir, "skill-repos", skillsetName);
  if (!(await exists(cloneDir))) {
    throw new Error(`Skillset not installed: ${skillsetName}`);
  }

  const skillDir = skillset.root_path
    ? join(cloneDir, skillset.root_path, name)
    : join(cloneDir, name);

  if (await exists(skillDir)) {
    throw new Error(`Directory already exists: ${skillDir}`);
  }

  await mkdir(skillDir, { recursive: true });
  await Bun.write(join(skillDir, "SKILL.md"), SKILL_TEMPLATE(name));

  return skillDir;
}
