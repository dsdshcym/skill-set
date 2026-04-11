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
  branch?: string;
  pin?: string;
}
```

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
- `serializeSkillfile(Skillset[])` → TOML string (round-trips cleanly)
- `readSkillfile` returns `Skillset[]`; callers that need `Skill[]` call `flattenSkillsets`

A `[[skill]]` entry parses into a `Skillset` with `skills: [name]`.

## Changes

- `config.ts`: Add `Skillset` type, `flattenSkillsets()`, update `parseSkillfile` to return `Skillset[]`, update `serializeSkillfile` to accept `Skillset[]` and write `[[skillset]]`/`[[skill]]` appropriately
- `cli.ts`: Call `flattenSkillsets` where `Skill[]` is needed
- `fork.ts`: Work with `Skillset[]` directly — find the skillset by name, update origin, serialize back
- `install.ts`, `freeze.ts`, `update.ts`: No change (they already receive `Skill[]`)
