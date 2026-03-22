# Skillstow

A git-native manager for Claude Code skills — declare your skills in a `Skillfile`,
install, customize, and track upstream changes without losing your edits.

Inspired by [GNU Stow](https://www.gnu.org/software/stow/) — which manages dotfiles as
symlinked packages — **Skillstow** applies the same idea to Claude skills: each skill is
a live git clone you can fork, edit, and merge upstream changes into. Declare them in a
`Skillfile` like a `Brewfile` for Homebrew, a `Gemfile` for Bundler, or a `vim-plug`
block for Vim.

## Problem

No good mechanism exists for treating Claude skills as editable, forkable,
upstream-trackable units. Current solutions all fall short:

| Approach | Install | Customize | Absorb upstream updates |
|----------|---------|-----------|------------------------|
| `ccpi` (npm-based) | ✅ | ❌ overwrites edits | ❌ |
| manual git clone | ✅ | ✅ | ❌ manual |
| Anthropic plugin marketplace | ✅ | ❌ | ❌ |

The missing piece: treat skills as **git repos you actively edit**, not tarballs you
install.

## Design

Each skill is a git clone, pinned in a `Skillfile.lock`, forkable and merge-trackable.

### Skillfile (`~/.claude/Skillfile`)

```toml
[[skill]]
name    = "extract-notes"
origin  = "https://github.com/dsdshcym/dotfiles"
path    = ".claude/skills/extract-notes"   # subpath within repo
branch  = "master"
pin     = "abc1234"                        # written by skillstow freeze

[[skill]]
name    = "git-commit-messages"
origin  = "https://github.com/dsdshcym/dotfiles"
path    = ".claude/skills/git-commit-messages"
branch  = "master"
```

### Commands

| Command | Effect |
|---------|--------|
| `skillstow install` | Clone/fetch origins, checkout pinned commits, symlink into `~/.claude/skills/` |
| `skillstow update <name>` | `git fetch origin`, merge upstream, update `Skillfile.lock` |
| `skillstow freeze` | Write current HEAD of every skill into `Skillfile.lock` |
| `skillstow add <url> [path]` | Append to `Skillfile`, run install |
| `skillstow fork <name> <your-url>` | Change origin, push current state, continue tracking |

### Directory layout

```
~/.claude/
├── skills/                  # symlinks managed by skillstow
│   ├── extract-notes -> ~/.claude/skill-repos/dotfiles/.claude/skills/extract-notes
│   └── git-commit-messages -> ...
├── skill-repos/             # git clones (source of truth)
│   └── dotfiles/            # cloned from dsdshcym/dotfiles
├── Skillfile                # your declarations
└── Skillfile.lock           # pinned commits, auto-generated
```

Skills that live inside a dotfiles repo get the whole repo cloned once; multiple skills
from the same repo share one clone.

### Non-goals

- No registry / discovery — use existing: [`travisvn/awesome-claude-skills`](https://github.com/travisvn/awesome-claude-skills)
- No skill authoring tooling — use Anthropic's SKILL.md spec directly
- No version negotiation — Claude handles compatibility

## Compatibility

Skills are compatible with manual install (just copy the `SKILL.md` folder) and
publishable to CCPI/npm for discoverability. Skillstow adds a git-native workflow on top,
not a new format.
