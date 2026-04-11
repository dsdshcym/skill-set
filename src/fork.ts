import { join } from "node:path";
import { $ } from "bun";
import { readSkillfile, serializeSkillfile, cloneDirName } from "./config";

export async function fork(name: string, newOrigin: string, claudeDir: string): Promise<void> {
  const skillfilePath = join(claudeDir, "Skillfile");
  const skills = await readSkillfile(skillfilePath);

  // Check if name matches an individual skill in a multi-skill skillset
  const asSkill = skills.find((s) => s.name === name && s.skillset !== name);
  if (asSkill) {
    throw new Error(`"${name}" is part of skillset "${asSkill.skillset}". Run: skill-set fork ${asSkill.skillset} <url>`);
  }

  const group = skills.filter((s) => cloneDirName(s) === name);
  if (group.length === 0) {
    throw new Error(`Skillset "${name}" not found in Skillfile`);
  }

  const cloneDir = join(claudeDir, "skill-repos", name);
  await $`git -C ${cloneDir} remote set-url origin ${newOrigin}`.quiet();

  const branch = (await $`git -C ${cloneDir} rev-parse --abbrev-ref HEAD`.quiet()).stdout.toString().trim();
  await $`git -C ${cloneDir} push -u origin ${branch}`.quiet();

  // Update origin for all skills in this skillset
  for (const skill of group) {
    skill.origin = newOrigin;
  }
  await Bun.write(skillfilePath, serializeSkillfile(skills));
}
