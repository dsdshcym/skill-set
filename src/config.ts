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
  skillset?: string;
  branch?: string;
  pin?: string;
}

interface RawSkillset {
  name: string;
  origin: string;
  root_path?: string;
  skills: string[];
  branch?: string;
  pin?: string;
}

export function cloneDirName(skill: Skill): string {
  return skill.skillset ?? skill.name;
}

export function parseSkillfile(content: string): Skill[] {
  if (!content.trim()) return [];
  const parsed = Bun.TOML.parse(content) as { skill?: Skill[]; skillset?: RawSkillset[] };

  const skills: Skill[] = (parsed.skill ?? []).map((s) => ({
    ...s,
    skillset: s.name,
  }));

  for (const ss of parsed.skillset ?? []) {
    const rootPath = ss.root_path ?? "";
    for (const skillName of ss.skills) {
      skills.push({
        name: skillName,
        origin: ss.origin,
        path: rootPath ? `${rootPath}/${skillName}` : skillName,
        skillset: ss.name,
        ...(ss.branch ? { branch: ss.branch } : {}),
        ...(ss.pin ? { pin: ss.pin } : {}),
      });
    }
  }

  return skills;
}

export async function readSkillfile(skillfilePath: string): Promise<Skill[]> {
  const file = Bun.file(skillfilePath);
  if (!(await file.exists())) return [];
  return parseSkillfile(await file.text());
}
