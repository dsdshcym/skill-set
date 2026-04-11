import { join } from "node:path";
import { $ } from "bun";
import { readSkillfile, serializeSkillfile } from "./config";

export async function fork(name: string, newOrigin: string, claudeDir: string): Promise<void> {
  const skillfilePath = join(claudeDir, "Skillfile");
  const skillsets = await readSkillfile(skillfilePath);

  // Check if name matches an individual skill in a multi-skill skillset
  const asParent = skillsets.find((ss) => ss.skills.includes(name) && ss.name !== name);
  if (asParent) {
    throw new Error(`"${name}" is part of skillset "${asParent.name}". Run: skill-set fork ${asParent.name} <url>`);
  }

  const skillset = skillsets.find((ss) => ss.name === name);
  if (!skillset) {
    throw new Error(`Skillset "${name}" not found in Skillfile`);
  }

  const cloneDir = join(claudeDir, "skill-repos", name);
  await $`git -C ${cloneDir} remote set-url origin ${newOrigin}`.quiet();

  const branch = (await $`git -C ${cloneDir} rev-parse --abbrev-ref HEAD`.quiet()).stdout.toString().trim();
  await $`git -C ${cloneDir} push -u origin ${branch}`.quiet();

  skillset.origin = newOrigin;
  await Bun.write(skillfilePath, serializeSkillfile(skillsets));
}
