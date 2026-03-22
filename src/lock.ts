export function parseLockfile(content: string): Record<string, string> {
  if (!content.trim()) return {};
  const parsed = Bun.TOML.parse(content) as { pins?: Record<string, string> };
  return parsed.pins ?? {};
}

export function serializeLockfile(pins: Record<string, string>): string {
  const lines = ["[pins]"];
  for (const [name, pin] of Object.entries(pins)) {
    lines.push(`${name} = "${pin}"`);
  }
  return lines.join("\n") + "\n";
}

export async function readLockfile(lockfilePath: string): Promise<Record<string, string>> {
  const file = Bun.file(lockfilePath);
  if (!(await file.exists())) return {};
  return parseLockfile(await file.text());
}
