import type { Skill } from "./config";

export function parseLockfile(content: string): Skill[] {
  if (!content.trim()) return [];
  const parsed = Bun.TOML.parse(content) as { skill?: Skill[] };
  return parsed.skill ?? [];
}

export function serializeLockfile(skills: Skill[]): string {
  return (
    skills
      .map((s) => {
        const lines = [
          `[[skill]]`,
          `name     = "${s.name}"`,
          `origin   = "${s.origin}"`,
        ];
        if (s.path) lines.push(`path     = "${s.path}"`);
        lines.push(`pin      = "${s.pin}"`);
        if (s.skillset) lines.push(`skillset = "${s.skillset}"`);
        return lines.join("\n");
      })
      .join("\n\n") + "\n"
  );
}

export async function readLockfile(lockfilePath: string): Promise<Skill[]> {
  const file = Bun.file(lockfilePath);
  if (!(await file.exists())) return [];
  return parseLockfile(await file.text());
}
