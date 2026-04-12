export interface Skill {
  name: string;
  origin: string;
  path: string;
  skillset?: string;
  branch?: string;
  pin?: string;
}

export interface Skillset {
  name: string;
  origin: string;
  root_path: string;
  skills: string[];
  path?: string;      // from [[skill]], overrides root_path derivation
  branch?: string;
  pin?: string;
}

export function cloneDirName(skill: Skill): string {
  return skill.skillset ?? skill.name;
}

export function flattenSkillsets(skillsets: Skillset[]): Skill[] {
  const skills: Skill[] = [];
  for (const ss of skillsets) {
    if (ss.path !== undefined) {
      // [[skill]] entry — use path directly
      skills.push({
        name: ss.name,
        origin: ss.origin,
        path: ss.path,
        skillset: ss.name,
        ...(ss.branch ? { branch: ss.branch } : {}),
        ...(ss.pin ? { pin: ss.pin } : {}),
      });
    } else {
      // [[skillset]] entry — derive path from root_path
      for (const skillName of ss.skills) {
        skills.push({
          name: skillName,
          origin: ss.origin,
          path: ss.root_path ? `${ss.root_path}/${skillName}` : skillName,
          skillset: ss.name,
          ...(ss.branch ? { branch: ss.branch } : {}),
          ...(ss.pin ? { pin: ss.pin } : {}),
        });
      }
    }
  }
  return skills;
}

export function parseSkillfile(content: string): Skillset[] {
  if (!content.trim()) return [];

  interface RawSkill {
    name: string;
    origin: string;
    path?: string;
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

  const parsed = Bun.TOML.parse(content) as { skill?: RawSkill[]; skillset?: RawSkillset[] };

  const skillsets: Skillset[] = (parsed.skill ?? []).map((s) => ({
    name: s.name,
    origin: s.origin,
    root_path: "",
    skills: [s.name],
    path: s.path ?? "",
    ...(s.branch ? { branch: s.branch } : {}),
    ...(s.pin ? { pin: s.pin } : {}),
  }));

  for (const ss of parsed.skillset ?? []) {
    skillsets.push({
      name: ss.name,
      origin: ss.origin,
      root_path: ss.root_path ?? "",
      skills: ss.skills,
      ...(ss.branch ? { branch: ss.branch } : {}),
      ...(ss.pin ? { pin: ss.pin } : {}),
    });
  }

  return skillsets;
}

export function serializeSkillfile(skillsets: Skillset[]): string {
  return (
    skillsets
      .map((ss) => {
        if (ss.path !== undefined) {
          // [[skill]] entry
          const lines = [
            `[[skill]]`,
            `name   = "${ss.name}"`,
            `origin = "${ss.origin}"`,
          ];
          if (ss.path) lines.push(`path   = "${ss.path}"`);
          if (ss.branch) lines.push(`branch = "${ss.branch}"`);
          if (ss.pin) lines.push(`pin    = "${ss.pin}"`);
          return lines.join("\n");
        } else {
          // [[skillset]] entry
          const lines = [
            `[[skillset]]`,
            `name      = "${ss.name}"`,
            `origin    = "${ss.origin}"`,
          ];
          if (ss.root_path) lines.push(`root_path = "${ss.root_path}"`);
          const skillsList = ss.skills.map((s) => `"${s}"`).join(", ");
          lines.push(`skills    = [${skillsList}]`);
          if (ss.branch) lines.push(`branch    = "${ss.branch}"`);
          if (ss.pin) lines.push(`pin       = "${ss.pin}"`);
          return lines.join("\n");
        }
      })
      .join("\n\n") + "\n"
  );
}

export async function readSkillfile(skillfilePath: string): Promise<Skillset[]> {
  const file = Bun.file(skillfilePath);
  if (!(await file.exists())) return [];
  return parseSkillfile(await file.text());
}
