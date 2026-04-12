import { join } from "node:path";
import { $ } from "bun";
import { readSkillfile, serializeSkillfile } from "./config";

export async function fork(name: string, newOrigin: string, claudeDir: string): Promise<void> {
  const skillfilePath = join(claudeDir, "Skillfile");
  const data = await readSkillfile(skillfilePath);

  // Check if name is an individual skill inside a multi-skill skillset
  const parentSet = data.skillsets.find((ss) => ss.skills.includes(name) && ss.name !== name);
  if (parentSet) {
    throw new Error(`"${name}" is part of skillset "${parentSet.name}". Run: skill-set fork ${parentSet.name} <url>`);
  }

  // Find as standalone skill or skillset
  const asSkill = data.skills.find((s) => s.name === name);
  const asSkillset = data.skillsets.find((ss) => ss.name === name);
  if (!asSkill && !asSkillset) {
    throw new Error(`Skillset "${name}" not found in Skillfile`);
  }

  const cloneDir = join(claudeDir, "skill-repos", name);
  await $`git -C ${cloneDir} remote set-url origin ${newOrigin}`.quiet();

  const branch = (await $`git -C ${cloneDir} rev-parse --abbrev-ref HEAD`.quiet()).stdout.toString().trim();
  await $`git -C ${cloneDir} push -u origin ${branch}`.quiet();

  if (asSkill) asSkill.origin = newOrigin;
  if (asSkillset) asSkillset.origin = newOrigin;
  await Bun.write(skillfilePath, serializeSkillfile(data));
}
