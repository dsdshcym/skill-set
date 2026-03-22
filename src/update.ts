import { join } from "node:path";
import { $ } from "bun";
import { repoName, type Skill } from "./config";
import { readLockfile, serializeLockfile } from "./lock";

export async function update(skill: Skill, claudeDir: string): Promise<void> {
  const cloneDir = join(claudeDir, "skill-repos", repoName(skill.origin));
  await $`git -C ${cloneDir} fetch origin`.quiet();
  await $`git -C ${cloneDir} merge --ff-only FETCH_HEAD`.quiet();

  const newHead = (await $`git -C ${cloneDir} rev-parse HEAD`.quiet()).stdout.toString().trim();
  const lockfilePath = join(claudeDir, "Skillfile.lock");
  const pins = await readLockfile(lockfilePath);
  pins[skill.name] = newHead;
  await Bun.write(lockfilePath, serializeLockfile(pins));
}
