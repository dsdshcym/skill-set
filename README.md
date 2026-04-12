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

A `[[skillset]]` groups multiple skills from one repo — one clone, many symlinks.
A `[[skill]]` is a standalone skill from its own repo.

```toml
[[skillset]]
name      = "dotfiles"
origin    = "https://github.com/dsdshcym/dotfiles"
root_path = ".claude/skills"
branch    = "macos"
skills    = [
  "extract-notes",
  "extract-notes-zoom",
  "git-commit-messages",
  "so-far",
]

[[skillset]]
name      = "gsuite-skills"
origin    = "https://github.com/dsdshcym/gsuite-skills.git"
skills    = ["gdoc", "gmail", "gsheet", "gws-base"]

[[skill]]
name   = "people"
origin = "https://github.com/dsdshcym/people-skill.git"
```

- `[[skillset]]`: `root_path` (default `""`) is prepended to each skill name to form the path within the repo
- `[[skill]]`: `path` is the direct path to the skill within the repo. Omit for repo-root skills.

### Commands

| Command | Effect |
|---------|--------|
| `skill-set new <name> [--in <set>]` | Scaffold a new skill (standalone git repo or inside an existing skillset) |
| `skill-set install` | Clone/fetch origins, checkout pinned commits, symlink into `~/.claude/skills/` |
| `skill-set update <name>` | `git fetch origin`, merge upstream, update `Skillfile.lock` |
| `skill-set freeze` | Write current HEAD of every skill into `Skillfile.lock` |
| `skill-set fork <name> <your-url>` | Change origin, push current state, continue tracking |

Edit the Skillfile directly to add or remove skills, then run `skill-set install`.

### Directory layout

```
~/.claude/
├── skills/                  # symlinks managed by skill-set
│   ├── extract-notes     -> ../skill-repos/dotfiles/.claude/skills/extract-notes
│   ├── git-commit-messages -> ../skill-repos/dotfiles/.claude/skills/git-commit-messages
│   ├── gdoc              -> ../skill-repos/gsuite-skills/gdoc
│   └── people            -> ../skill-repos/people
├── skill-repos/             # git clones (source of truth)
│   ├── dotfiles/            # one clone, many skills
│   ├── gsuite-skills/       # one clone, many skills
│   └── people/              # standalone skill
├── Skillfile                # your declarations
└── Skillfile.lock           # pinned commits, auto-generated
```

A `[[skillset]]` shares one clone for all its skills.
A `[[skill]]` gets its own clone, named after the skill.

### Non-goals

- No registry / discovery — use existing: [`travisvn/awesome-claude-skills`](https://github.com/travisvn/awesome-claude-skills)
- No skill authoring beyond scaffolding — `skill-set new` creates the directory and SKILL.md; use Anthropic's spec directly for content
- No version negotiation — Claude handles compatibility

## Compatibility

Skills are compatible with manual install (just copy the `SKILL.md` folder) and
publishable to CCPI/npm for discoverability. Skill-set adds a git-native workflow on top,
not a new format.
