import { mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { type Skill } from "./config";
import { install } from "./install";

function serializeSkill(skill: Skill): string {
  const lines = [
    `[[skill]]`,
    `name   = "${skill.name}"`,
    `origin = "${skill.origin}"`,
    `path   = "${skill.path}"`,
  ];
  if (skill.branch) lines.push(`branch = "${skill.branch}"`);
  return lines.join("\n") + "\n";
}

export async function add(skill: Skill, claudeDir: string): Promise<void> {
  const skillfilePath = join(claudeDir, "Skillfile");
  await mkdir(dirname(skillfilePath), { recursive: true });

  const file = Bun.file(skillfilePath);
  const current = (await file.exists()) ? await file.text() : "";
  const separator = current.trim() ? "\n\n" : "";
  await Bun.write(skillfilePath, current + separator + serializeSkill(skill));

  await install([skill], claudeDir);
}
