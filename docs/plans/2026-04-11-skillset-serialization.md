# Skillset Serialization: Preserving Skillfile Structure

## Problem

`serializeSkillfile` flattened `[[skillset]]` entries into individual `[[skill]]` entries, destroying the user's authoring structure when `fork` rewrites the Skillfile.

## Solution

Parse `[[skill]]` and `[[skillset]]` into their native types directly. No translation between them unless necessary.

```typescript
interface Skill { name, origin, path, skillset?, branch?, pin? }
interface Skillset { name, origin, root_path, skills[], branch?, pin? }
interface SkillfileData { skills: Skill[], skillsets: Skillset[] }
```

- `[[skill]]` has `path` — direct path to the skill. `""` = repo root.
- `[[skillset]]` has `root_path` + `skills[]` — prefix-based derivation.

## Data Flow

```
Skillfile ──(parse)──> SkillfileData { skills, skillsets }
                              │              │
                        used directly   used directly
                              │              │
                    (only merge for freeze → Skillfile.lock)
```

- `install` handles both natively: one clone per skill, one clone per skillset with N symlinks
- `update`/`fork` find by name in either list
- `freeze` is the only place that expands skillsets into individual lock entries
- `serializeSkillfile` writes each back in its native format — round-trips exactly
