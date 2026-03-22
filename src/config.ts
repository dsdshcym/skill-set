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
