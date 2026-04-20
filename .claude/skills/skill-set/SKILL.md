---
name: skill-set
description: Use when managing Claude Code skills declaratively via a Skillfile — adding, installing, pinning, updating, forking, or scaffolding skills from git repos. Triggers on mentions of Skillfile, Skillfile.lock, skill-repos, `skill-set` CLI, or questions about how to install/update/pin a skill from a git URL.
---

# skill-set

Git-native manager for Claude Code skills. Users declare skills in `~/.claude/Skillfile` (TOML); `skill-set` clones each origin into `~/.claude/skill-repos/<name>/`, symlinks into `~/.claude/skills/<name>`, and pins commits in `Skillfile.lock`.

## When to Use

- User wants to add/install a skill from a git URL
- User mentions `Skillfile`, `Skillfile.lock`, or `skill-repos`
- User asks to pin, freeze, update, or fork a skill
- User wants to scaffold a new skill
- User wants to share or reproduce a skill setup across machines

**Not for:** authoring SKILL.md content (use skill authoring references), publishing to a registry, or managing non-git skills.

## Mental Model

```
~/.claude/
├── Skillfile              # declarations (edit this)
├── Skillfile.lock         # pinned commits (auto-generated)
├── skill-repos/<name>/    # live git clones — editable, forkable
└── skills/<name>/         # symlinks → skill-repos
```

- `[[skill]]` = one repo, one skill.
- `[[skillset]]` = one repo, many skills (shared clone).
- Each skill-repo is a **real git clone** — `cd` in, edit, commit, push normally.

## Commands

| Command | Effect |
|---------|--------|
| `skill-set new <name> [--in <skillset>]` | Scaffold skill: standalone creates a new git repo in `skill-repos/<name>`; `--in <skillset>` creates a directory inside an existing skillset clone |
| `skill-set install` | Clone/fetch origins, checkout pinned commits, symlink into `~/.claude/skills/` |
| `skill-set update <name>` | `git fetch` + merge upstream for a skill or skillset, then update lock |
| `skill-set freeze` | Write current HEAD of every skill into `Skillfile.lock` |
| `skill-set fork <name> <url>` | Change origin to `<url>`, push current state, continue tracking |

Edit `Skillfile` directly to add/remove skills, then run `install`.

## Skillfile Syntax

```toml
# Multiple skills from one repo (shared clone)
[[skillset]]
name      = "dotfiles"
origin    = "https://github.com/user/dotfiles"
root_path = ".claude/skills"          # prepended to each skill name
branch    = "macos"                   # optional
skills    = ["extract-notes", "so-far"]

# Skill with a path that differs from its name
[[skillset]]
name   = "mixed"
origin = "https://github.com/user/mixed"
skills = [
  "plain-skill",
  {name = "renamed", path = "actual/dir/name"},
]

# Standalone skill (its own repo)
[[skill]]
name   = "people"
origin = "https://github.com/user/people-skill.git"
# path   = "subdir"   # optional; omit for repo-root skills
# pin    = "abc1234"  # optional; overrides Skillfile.lock
```

Key points:
- `root_path` defaults to `""`; prepended to each skill's `name`/`path` to locate it inside the repo.
- Skill entries can be a bare string (name = path) or `{name, path}` table.
- `pin` in `Skillfile` is a hard declaration; `Skillfile.lock` is the auto-managed pin.

## Common Workflows

**Add a skill from a URL:**
1. Append a `[[skill]]` or `[[skillset]]` block to `~/.claude/Skillfile`.
2. Run `skill-set install`.
3. (Optional) `skill-set freeze` to pin the current commit.

**Reproduce a setup on a new machine:** commit `Skillfile` + `Skillfile.lock` to dotfiles, then `skill-set install` checks out the exact pinned commits.

**Edit an installed skill:** `cd ~/.claude/skill-repos/<name>` and edit/commit/push like any git repo. The symlink in `~/.claude/skills/` picks up changes immediately.

**Track upstream changes:** `skill-set update <name>` fetches + merges; resolve conflicts in the clone like normal git.

**Take ownership of a fork:** `skill-set fork <name> <your-url>` changes origin and pushes; subsequent `update`s pull from your fork.

**Scaffold a new skill in an existing skillset:** `skill-set new my-skill --in dotfiles` creates `~/.claude/skill-repos/dotfiles/<root_path>/my-skill/SKILL.md`. The skillset must already be installed. You still need to add `my-skill` to the skillset's `skills = [...]` list in `Skillfile` for `install` to symlink it.

## Common Mistakes

- **Editing files in `~/.claude/skills/<name>`** — those are symlinks; edit the real path in `skill-repos/<name>`. (Edits via the symlink work, but know what you're changing.)
- **Forgetting to add a new skill to the skillset's `skills = [...]`** after `skill-set new --in` — the file exists on disk but won't be symlinked.
- **Committing local edits to someone else's origin** — `skill-set fork` first to point origin at your own URL, then push.
- **Expecting `update` on a skill with a `pin` in the Skillfile** — the explicit `pin` overrides; remove it or re-freeze.
- **Manually editing `Skillfile.lock`** — run `skill-set freeze` instead.

## Development

Repo: typically `~/Projects/skill-set`. Bun project with zero runtime deps.

```bash
bun test                                       # all tests
bun test src/install.test.ts                   # single file
bun build --compile src/cli.ts --outfile skill-set   # self-contained binary
```
