import { join } from "node:path";
import { $ } from "bun";
import type { Skill, SkillfileData } from "./config";
import { resolveSkillEntry } from "./config";
import { serializeLockfile } from "./lock";

export async function freeze(data: SkillfileData, claudeDir: string): Promise<void> {
  const locked: Skill[] = [];

  // Freeze standalone skills
  for (const skill of data.skills) {
    const cloneDir = join(claudeDir, "skill-repos", skill.name);
    const pin = (await $`git -C ${cloneDir} rev-parse HEAD`.quiet()).stdout.toString().trim();
    locked.push({ ...skill, pin });
  }

  // Freeze skillsets — one rev-parse per set, N lock entries
  for (const ss of data.skillsets) {
    const cloneDir = join(claudeDir, "skill-repos", ss.name);
    const pin = (await $`git -C ${cloneDir} rev-parse HEAD`.quiet()).stdout.toString().trim();
    for (const entry of ss.skills) {
      const { name, path } = resolveSkillEntry(entry);
      locked.push({
        name,
        origin: ss.origin,
        path: ss.root_path ? `${ss.root_path}/${path}` : path,
        skillset: ss.name,
        pin,
      });
    }
  }

  await Bun.write(join(claudeDir, "Skillfile.lock"), serializeLockfile(locked));
}
