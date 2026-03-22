# Skillfile

A git-native manager for Claude Code skills — declare your skills in a file, install,
customize, and track upstream changes without losing your edits.

Like a `Brewfile` for Homebrew, a `Gemfile` for Bundler, a `vim-plug` block for Vim, or
a `package-lock.json` for npm — **Skillfile** is the declarative source of truth for
your Claude skills, with git-native version tracking built in.

## Problem

No good mechanism exists for treating Claude skills as editable, forkable,
upstream-trackable units. Current solutions all fall short:

| Approach | Install | Customize | Absorb upstream updates |
|----------|---------|-----------|------------------------|
| `ccpi` (npm-based) | ✅ | ❌ overwrites edits | ❌ |
| manual git clone | ✅ | ✅ | ❌ manual |
| Anthropic plugin marketplace | ✅ | ❌ | ❌ |

The missing piece: treat skills as **git repos you actively edit**, not tarballs you
install. Inspired by how Emacs's straight.el manages packages — each as a live git clone
you can fork, edit, and merge upstream changes into.

## Design

Each skill is a git worktree, pinned in a lockfile, forkable and merge-trackable.

### Config (`~/.claude/skills.toml`)

```toml
[[skill]]
name    = "extract-notes"
origin  = "https://github.com/dsdshcym/dotfiles"
path    = ".claude/skills/extract-notes"   # subpath within repo
branch  = "master"
pin     = "abc1234"                        # written by freeze

[[skill]]
name    = "git-commit-messages"
origin  = "https://github.com/dsdshcym/dotfiles"
path    = ".claude/skills/git-commit-messages"
branch  = "master"
```

### Commands

| Command | Effect |
|---------|--------|
| `install` | Clone/fetch origins, checkout pinned commits, symlink into `~/.claude/skills/` |
| `update <name>` | `git fetch origin`, merge upstream, update lockfile |
| `freeze` | Write current HEAD of every skill into lockfile |
| `add <url> [path]` | Append to config, run install |
| `fork <name> <your-url>` | Change origin, push current state, continue tracking |

### Directory layout

```
~/.claude/
├── skills/                  # symlinks managed by this tool
│   ├── extract-notes -> ~/.claude/skill-repos/dotfiles/.claude/skills/extract-notes
│   └── git-commit-messages -> ...
├── skill-repos/             # git clones (source of truth)
│   └── dotfiles/            # cloned from dsdshcym/dotfiles
└── skills.lock              # pinned commits, auto-generated
```

Skills that live inside a dotfiles repo get the whole repo cloned once; multiple skills
from the same repo share one clone.

### Non-goals

- No registry / discovery — use existing: [`travisvn/awesome-claude-skills`](https://github.com/travisvn/awesome-claude-skills)
- No skill authoring tooling — use Anthropic's SKILL.md spec directly
- No version negotiation — Claude handles compatibility

## Compatibility

Skills authored here are compatible with manual install (just copy the `SKILL.md` folder)
and publishable to CCPI/npm for discoverability. This tool adds a git-native workflow on
top, not a new format.
