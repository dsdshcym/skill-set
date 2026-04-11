import { join } from "node:path";
import { $ } from "bun";
import { cloneDirName, type Skill } from "./config";
import { readLockfile, serializeLockfile } from "./lock";

export async function update(name: string, skills: Skill[], claudeDir: string): Promise<void> {
  // Check if name matches an individual skill that belongs to a multi-skill skillset
  const asSkill = skills.find((s) => s.name === name && s.skillset !== name);
  if (asSkill) {
    throw new Error(`"${name}" is part of skillset "${asSkill.skillset}". Run: skill-set update ${asSkill.skillset}`);
  }

  const group = skills.filter((s) => cloneDirName(s) === name);
  if (group.length === 0) {
    throw new Error(`Skillset "${name}" not found`);
  }

  const cloneDir = join(claudeDir, "skill-repos", name);
  await $`git -C ${cloneDir} fetch origin`.quiet();
  await $`git -C ${cloneDir} merge --ff-only FETCH_HEAD`.quiet();

  const newHead = (await $`git -C ${cloneDir} rev-parse HEAD`.quiet()).stdout.toString().trim();

  const lockfilePath = join(claudeDir, "Skillfile.lock");
  const locked = await readLockfile(lockfilePath);
  const updated = locked.map((s) =>
    cloneDirName(s) === name ? { ...s, pin: newHead } : s
  );
  await Bun.write(lockfilePath, serializeLockfile(updated));
}
