import { join } from "node:path";
import { $ } from "bun";
import { readSkillfile, serializeSkillfile, cloneDirName } from "./config";

export async function fork(name: string, newOrigin: string, claudeDir: string): Promise<void> {
  const skillfilePath = join(claudeDir, "Skillfile");
  const skills = await readSkillfile(skillfilePath);

  const skill = skills.find((s) => s.name === name);
  if (!skill) throw new Error(`Skill "${name}" not found in Skillfile`);

  const cloneDir = join(claudeDir, "skill-repos", cloneDirName(skill));
  await $`git -C ${cloneDir} remote set-url origin ${newOrigin}`.quiet();

  const branch = (await $`git -C ${cloneDir} rev-parse --abbrev-ref HEAD`.quiet()).stdout.toString().trim();
  await $`git -C ${cloneDir} push -u origin ${branch}`.quiet();

  skill.origin = newOrigin;
  await Bun.write(skillfilePath, serializeSkillfile(skills));
}
