import { join } from "node:path";
import { $ } from "bun";
import { repoName, type Skill } from "./config";
import { serializeLockfile } from "./lock";

export async function freeze(skills: Skill[], claudeDir: string): Promise<void> {
  const pins: Record<string, string> = {};
  for (const skill of skills) {
    const cloneDir = join(claudeDir, "skill-repos", repoName(skill.origin));
    pins[skill.name] = (await $`git -C ${cloneDir} rev-parse HEAD`.quiet()).stdout.toString().trim();
  }
  await Bun.write(join(claudeDir, "Skillfile.lock"), serializeLockfile(pins));
}
