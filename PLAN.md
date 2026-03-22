# Implementation Plan

## Tech Stack Decision

**Language: Native Go**

Go is the right fit for this CLI tool:

- **Single static binary** — users `go install` once, no runtime dependencies, works everywhere
- **Git operations** — `os/exec` wrapping `git` CLI is simpler and more reliable than a Go git library; we need real git behavior (worktrees, merges) not a reimplementation
- **TOML parsing** — `github.com/BurntSushi/toml` is mature and minimal
- **Symlink / filesystem ops** — Go stdlib covers everything needed
- **No Docker required** — Docker is available in this environment but adds overhead; native Go avoids it entirely

Alternatives considered and rejected:

| Option | Reason rejected |
|--------|----------------|
| Docker + Elixir | Container startup overhead per command; adds a runtime dep for users |
| Node/npm | Viable path (see below), but carries irony and a Node.js runtime dep |
| Shell script | Poor error handling, hard to test, not easily cross-platform |

### Note on Node/npm

npm-first with Brew later is a legitimate distribution path:

1. `npm install -g claude-skills` — works today, requires Node.js
2. Homebrew formula later — a `brew tap` formula can either wrap the npm install or bundle a standalone binary via `pkg`/`nexe`

The practical concern isn't distribution — it's the **runtime dep**: users need Node.js installed. Go produces a static binary with zero runtime requirements.

The irony worth noting: `ccpi` (the tool this replaces) is npm-based. The README calls it out as a rejected approach. The problem with `ccpi` was *behavior* (overwrites edits, no upstream tracking) not npm itself — so using npm here wouldn't be self-contradictory, just mildly ironic.

**Decision: stay with Go** for the zero-runtime-dep binary, but npm is not a blocker if Go proves difficult.

## Commands to Implement

See README.md for the full command spec: `install`, `update`, `freeze`, `add`, `fork`.

## File Layout

```
cmd/
  claude-skills/
    main.go          # CLI entry point (cobra or flag-based)
internal/
  config/            # skills.toml read/write
  lock/              # skills.lock read/write
  git/               # git exec wrappers (clone, fetch, worktree, symlink)
  skill/             # install/update/freeze/add/fork logic
```

## Open Questions

- Use `cobra` for CLI or keep it simple with `flag`? (lean toward `flag` to avoid deps)
- Config location: `~/.claude/skills.toml` hardcoded or `--config` flag?
