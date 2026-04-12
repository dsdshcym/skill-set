# Skillset Serialization: Preserving Skillfile Structure

## Problem

`serializeSkillfile` flattens `[[skillset]]` entries into individual `[[skill]]` entries. This destroys the user's authoring structure when `fork` rewrites the Skillfile.

## Solution

Introduce a `Skillset` type for Skillfile representation. The Skillfile is parsed into `Skillset[]`, which preserves the original structure. A separate `flatten` function produces `Skill[]` for downstream commands.

```typescript
interface Skillset {
  name: string;
  origin: string;
  root_path: string;  // default: ""
  skills: string[];
  path?: string;      // from [[skill]], overrides root_path derivation
  branch?: string;
  pin?: string;
}
```

`[[skill]]` and `[[skillset]]` use different path fields:
- `[[skill]]` has `path` — direct path to the skill within the repo. Omit or `""` for repo-root skills.
- `[[skillset]]` has `root_path` — prefix prepended to each skill name to derive paths.

The `path` field on `Skillset` serves double duty: it stores the original `[[skill]]` path, and its presence/absence determines serialization format (`[[skill]]` vs `[[skillset]]`).

## Data Flow

```
Skillfile ──(parse)──> Skillset[] ──(flatten)──> Skill[]
                           │
                     (serialize)
                           │
                       Skillfile
```

- `parseSkillfile` → `Skillset[]` (preserves structure)
- `flattenSkillsets` → `Skill[]` (for install, freeze, update, etc.)
  - If `path` is present: uses it directly as the Skill's path
  - Otherwise: derives path from `root_path + "/" + skillName`
- `serializeSkillfile(Skillset[])` → TOML string (round-trips cleanly)
- `readSkillfile` returns `Skillset[]`; callers that need `Skill[]` call `flattenSkillsets`

## Changes

- `config.ts`: Add `Skillset` type with optional `path`, `flattenSkillsets()`, update `parseSkillfile` to return `Skillset[]`, update `serializeSkillfile` to write `[[skill]]` (when `path` present) or `[[skillset]]` (when absent)
- `cli.ts`: Call `flattenSkillsets` where `Skill[]` is needed
- `fork.ts`: Work with `Skillset[]` directly — find the skillset by name, update origin, serialize back
- `install.ts`, `freeze.ts`, `update.ts`: No change (they already receive `Skill[]`)
