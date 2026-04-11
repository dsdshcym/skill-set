# Skill-set

A git-native manager for Claude Code skills — declare your skills in a `Skillfile`,
install, customize, and track upstream changes without losing your edits.

**Skill-set** — as a noun, it's the skillset for your AI agent; as a verb, *set* (pin)
your skills to specific versions.

**Skill-set** applies familiar ideas from the tools you already use:

- [GNU Stow](https://www.gnu.org/software/stow/) — manages dotfiles as symlinked packages
- [straight.el](https://github.com/radian-software/straight.el) — each Emacs package is a live git clone you can fork, edit, and merge upstream changes into
- [Homebrew Bundle](https://github.com/Homebrew/homebrew-bundle) — declare dependencies in a `Brewfile`, reproduce anywhere
- [Bundler](https://bundler.io/) — `Gemfile` + `Gemfile.lock` for reproducible installs
- [vim-plug](https://github.com/junegunn/vim-plug) — declare plugins in your vimrc, manage with git

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
pin     = "abc1234"                        # written by skill-set freeze

[[skill]]
name    = "git-commit-messages"
origin  = "https://github.com/dsdshcym/dotfiles"
path    = ".claude/skills/git-commit-messages"
branch  = "master"

[[skill]]
name    = "tdd"
origin  = "https://github.com/anthropics/claude-skills"
path    = "tdd"
pin     = "def5678"
```

### Commands

| Command | Effect |
|---------|--------|
| `skill-set install` | Clone/fetch origins, checkout pinned commits, symlink into `~/.claude/skills/` |
| `skill-set update <name>` | `git fetch origin`, merge upstream, update `Skillfile.lock` |
| `skill-set freeze` | Write current HEAD of every skill into `Skillfile.lock` |
| `skill-set add <url> [path]` | Append to `Skillfile`, run install |
| `skill-set fork <name> <your-url>` | Change origin, push current state, continue tracking |

### Directory layout

```
~/.claude/
├── skills/                  # symlinks managed by skill-set
│   ├── extract-notes -> ~/.claude/skill-repos/extract-notes/.claude/skills/extract-notes
│   ├── git-commit-messages -> ~/.claude/skill-repos/git-commit-messages/.claude/skills/git-commit-messages
│   └── tdd -> ~/.claude/skill-repos/tdd/tdd
├── skill-repos/             # git clones (source of truth)
│   ├── extract-notes/       # cloned from dsdshcym/dotfiles
│   ├── git-commit-messages/ # cloned from dsdshcym/dotfiles
│   └── tdd/                 # cloned from anthropics/claude-skills
├── Skillfile                # your declarations
└── Skillfile.lock           # pinned commits, auto-generated
```

Each skill gets its own independent clone, named after the skill. 
This means skills that share an upstream repo can be forked and customized independently.

### Non-goals

- No registry / discovery — use existing: [`travisvn/awesome-claude-skills`](https://github.com/travisvn/awesome-claude-skills)
- No skill authoring tooling — use Anthropic's SKILL.md spec directly
- No version negotiation — Claude handles compatibility

## Compatibility

Skills are compatible with manual install (just copy the `SKILL.md` folder) and
publishable to CCPI/npm for discoverability. Skill-set adds a git-native workflow on top,
not a new format.
