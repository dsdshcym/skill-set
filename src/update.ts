import { join } from "node:path";
import { $ } from "bun";
import type { SkillfileData } from "./config";
import { resolveSkillEntry } from "./config";
import { readLockfile, serializeLockfile } from "./lock";

export async function update(name: string, data: SkillfileData, claudeDir: string): Promise<void> {
  // Check if name is an individual skill inside a multi-skill skillset
  const parentSet = data.skillsets.find((ss) => ss.skills.some((e) => resolveSkillEntry(e).name === name) && ss.name !== name);
  if (parentSet) {
    throw new Error(`"${name}" is part of skillset "${parentSet.name}". Run: skill-set update ${parentSet.name}`);
  }

  // Find as standalone skill or skillset
  const asSkill = data.skills.find((s) => s.name === name);
  const asSkillset = data.skillsets.find((ss) => ss.name === name);
  if (!asSkill && !asSkillset) {
    throw new Error(`Skillset "${name}" not found`);
  }

  const cloneDir = join(claudeDir, "skill-repos", name);
  await $`git -C ${cloneDir} fetch origin`.quiet();
  await $`git -C ${cloneDir} merge --ff-only FETCH_HEAD`.quiet();

  const newHead = (await $`git -C ${cloneDir} rev-parse HEAD`.quiet()).stdout.toString().trim();

  const lockfilePath = join(claudeDir, "Skillfile.lock");
  const locked = await readLockfile(lockfilePath);
  const updated = locked.map((s) => {
    if (s.name === name || s.skillset === name) {
      return { ...s, pin: newHead };
    }
    return s;
  });
  await Bun.write(lockfilePath, serializeLockfile(updated));
}
