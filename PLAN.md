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
| Node/npm (like `ccpi`) | Ironic to use npm for a tool that exists partly because npm-based installs are fragile |
| Shell script | Poor error handling, hard to test, not easily cross-platform |

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
