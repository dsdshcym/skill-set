# Implementation Plan

## Tech Stack Decision

**Language: Node.js / npm**

JS/npm is the right fit:

- **Same runtime as Claude Code itself** — Claude Code is a Node.js app bundled as a binary; this tool lives in the same ecosystem
- **npm install -g** — familiar one-liner for Claude Code users who already have Node
- **Brew later** — a `brew tap` formula can wrap the npm install or bundle a standalone binary via `pkg`/`@yao-pkg/pkg`
- **Git operations** — `execa` or `node:child_process` wrapping `git` CLI; same approach as Go, no difference
- **TOML parsing** — `@iarna/toml` or `smol-toml`; mature options available
- **No Docker required** — native Node.js, no containers needed

Alternatives considered and rejected:

| Option | Reason rejected |
|--------|----------------|
| Docker + Elixir | Container startup overhead per command; adds a heavy runtime dep for users |
| Go | Good zero-dep binary story, but Node is already required for Claude Code — no extra dep in practice |
| Shell script | Poor error handling, hard to test, not easily cross-platform |

## Commands to Implement

See README.md for the full command spec: `install`, `update`, `freeze`, `add`, `fork`.

## File Layout

```
src/
  cli.ts (or .js)    # CLI entry point (commander or minimist)
  config.ts          # skills.toml read/write
  lock.ts            # skills.lock read/write
  git.ts             # git exec wrappers (clone, fetch, worktree, symlink)
  skill.ts           # install/update/freeze/add/fork logic
package.json
```

## Open Questions

- TypeScript or plain JS? (TS gives better maintainability; plain JS avoids a build step)
- Use `commander` for CLI or keep it simple with `minimist`?
- Config location: `~/.claude/skills.toml` hardcoded or `--config` flag?
