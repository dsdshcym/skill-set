import { join } from "node:path";
import { $ } from "bun";
import { cloneDirName, type Skill } from "./config";
import { serializeLockfile } from "./lock";

export async function freeze(skills: Skill[], claudeDir: string): Promise<void> {
  const pinned = new Map<string, string>();

  for (const skill of skills) {
    const dirName = cloneDirName(skill);
    if (!pinned.has(dirName)) {
      const cloneDir = join(claudeDir, "skill-repos", dirName);
      const pin = (await $`git -C ${cloneDir} rev-parse HEAD`.quiet()).stdout.toString().trim();
      pinned.set(dirName, pin);
    }
  }

  const locked: Skill[] = skills.map((s) => ({
    ...s,
    pin: pinned.get(cloneDirName(s))!,
  }));

  await Bun.write(join(claudeDir, "Skillfile.lock"), serializeLockfile(locked));
}
