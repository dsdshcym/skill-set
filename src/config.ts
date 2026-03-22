import { basename } from "node:path";

export function repoName(origin: string): string {
  return basename(origin).replace(/\.git$/, "");
}

export function serializeSkillfile(skills: Skill[]): string {
  return (
    skills
      .map((s) => {
        const lines = [
          `[[skill]]`,
          `name   = "${s.name}"`,
          `origin = "${s.origin}"`,
          `path   = "${s.path}"`,
        ];
        if (s.branch) lines.push(`branch = "${s.branch}"`);
        if (s.pin) lines.push(`pin    = "${s.pin}"`);
        return lines.join("\n");
      })
      .join("\n\n") + "\n"
  );
}

export interface Skill {
  name: string;
  origin: string;
  path: string;
  branch?: string;
  pin?: string;
}

export function parseSkillfile(content: string): Skill[] {
  if (!content.trim()) return [];
  const parsed = Bun.TOML.parse(content) as { skill?: Skill[] };
  return parsed.skill ?? [];
}

export async function readSkillfile(skillfilePath: string): Promise<Skill[]> {
  const file = Bun.file(skillfilePath);
  if (!(await file.exists())) return [];
  return parseSkillfile(await file.text());
}
