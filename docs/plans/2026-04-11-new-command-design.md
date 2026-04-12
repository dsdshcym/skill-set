# `skill-set new` Command Design

## Purpose

Scaffold new skills — either as standalone git repos or within existing skillsets. Handles only file creation; wiring up symlinks and Skillfile entries is left to `skill-set install`.

## Command Interface

### Standalone mode: `skill-set new <name>`

1. `git init` in `<claudeDir>/skill-repos/<name>/`
2. Create `SKILL.md` with minimal template (name pre-filled)

### Skillset mode: `skill-set new <name> --in <skillset>`

1. Resolve the skillset from Skillfile — error if not found or not installed
2. Create directory at `<skill-repos>/<skillset>/<root_path>/<name>/`
3. Create `SKILL.md` with minimal template

### Output

Print the path to the created skill directory.

### Errors

- Directory already exists at target path — error, don't overwrite
- `--in` references unknown/uninstalled skillset — error
- Missing `<name>` argument — error with usage hint

### claudeDir override

Same pattern as `install` — function accepts `claudeDir` parameter, CLI defaults to `~/.claude/`.

## SKILL.md Template

```markdown
---
name: <name>
description: 
---

```

## Implementation

**New file:** `src/new.ts` + `src/new.test.ts`

```typescript
export async function newSkill(
  name: string,
  inSkillset: string | undefined,
  data: SkillfileData,
  claudeDir: string
): Promise<string>  // returns path to created directory
```

**CLI dispatch in `cli.ts`:** Parse `--in <skillset>` from args. Call `newSkill()`.

## Test Plan

- Standalone: creates git repo + SKILL.md at expected path
- Skillset: creates directory + SKILL.md under correct root_path
- Error: duplicate directory, unknown skillset, missing argument