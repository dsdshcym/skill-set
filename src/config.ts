export interface Skill {
  name: string;
  origin: string;
  path: string;
  skillset?: string;
  branch?: string;
  pin?: string;
}

export type SkillEntry = string | { name: string; path: string };

export interface Skillset {
  name: string;
  origin: string;
  root_path: string;
  skills: SkillEntry[];
  branch?: string;
  pin?: string;
}

export function resolveSkillEntry(entry: SkillEntry): { name: string; path: string } {
  if (typeof entry === "string") return { name: entry, path: entry };
  return entry;
}


export interface SkillfileData {
  skills: Skill[];
  skillsets: Skillset[];
}

export function cloneDirName(skill: Skill): string {
  return skill.skillset ?? skill.name;
}

export function parseSkillfile(content: string): SkillfileData {
  if (!content.trim()) return { skills: [], skillsets: [] };

  const parsed = Bun.TOML.parse(content) as {
    skill?: { name: string; origin: string; path?: string; branch?: string; pin?: string }[];
    skillset?: { name: string; origin: string; root_path?: string; skills: (string | { name: string; path: string })[]; branch?: string; pin?: string }[];
  };

  const skills: Skill[] = (parsed.skill ?? []).map((s) => ({
    name: s.name,
    origin: s.origin,
    path: s.path ?? "",
    ...(s.branch ? { branch: s.branch } : {}),
    ...(s.pin ? { pin: s.pin } : {}),
  }));

  const skillsets: Skillset[] = (parsed.skillset ?? []).map((ss) => ({
    name: ss.name,
    origin: ss.origin,
    root_path: ss.root_path ?? "",
    skills: ss.skills,
    ...(ss.branch ? { branch: ss.branch } : {}),
    ...(ss.pin ? { pin: ss.pin } : {}),
  }));

  return { skills, skillsets };
}

export function serializeSkillfile(data: SkillfileData): string {
  const parts: string[] = [];

  for (const s of data.skills) {
    const lines = [
      `[[skill]]`,
      `name   = "${s.name}"`,
      `origin = "${s.origin}"`,
    ];
    if (s.path) lines.push(`path   = "${s.path}"`);
    if (s.branch) lines.push(`branch = "${s.branch}"`);
    if (s.pin) lines.push(`pin    = "${s.pin}"`);
    parts.push(lines.join("\n"));
  }

  for (const ss of data.skillsets) {
    const lines = [
      `[[skillset]]`,
      `name      = "${ss.name}"`,
      `origin    = "${ss.origin}"`,
    ];
    if (ss.root_path) lines.push(`root_path = "${ss.root_path}"`);
    const skillsList = ss.skills.map((s) =>
      typeof s === "string" ? `"${s}"` : `{name = "${s.name}", path = "${s.path}"}`
    ).join(", ");
    lines.push(`skills    = [${skillsList}]`);
    if (ss.branch) lines.push(`branch    = "${ss.branch}"`);
    if (ss.pin) lines.push(`pin       = "${ss.pin}"`);
    parts.push(lines.join("\n"));
  }

  return parts.join("\n\n") + "\n";
}

export async function readSkillfile(skillfilePath: string): Promise<SkillfileData> {
  const file = Bun.file(skillfilePath);
  if (!(await file.exists())) return { skills: [], skillsets: [] };
  return parseSkillfile(await file.text());
}
