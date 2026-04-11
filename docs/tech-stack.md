# Tech Stack

## Runtime: Bun

- **Built-in TypeScript** — no build config, no `tsc`/`esbuild`
- **Built-in TOML** — `Bun.TOML.parse()`, no extra dependency
- **`bun build --compile`** — single self-contained binary, zero runtime dep for end users
- **Fast startup** — CLI tools feel snappier

## Distribution: compiled binary

- `brew install skill-set` via a tap (primary)
- Direct binary download as fallback
- No Node/Bun required on the user's machine

Alternatives considered and rejected:

| Option | Reason rejected |
|--------|----------------|
| Node.js + npm | Build step needed for TS; TOML needs a dep; npm global installs are clunky |
| Go | Good binary story, but Bun matches it while staying in JS/TS |
| Shell script | Poor error handling, hard to test, not easily cross-platform |
| Docker + Elixir | Container startup overhead; heavy runtime dep |

## File Layout

```
src/
  cli.ts        # CLI entry point (commander)
  config.ts     # Skillfile read/write
  lock.ts       # Skillfile.lock read/write
  git.ts        # git exec wrappers (clone, fetch, merge, symlink)
  skill.ts      # install/update/freeze/add/fork logic
package.json
```

## Commands

| Command | Effect |
|---------|--------|
| `skill-set install` | Clone/fetch origins, checkout pinned commits, symlink into `~/.claude/skills/` |
| `skill-set update <name>` | `git fetch origin`, merge upstream, update `Skillfile.lock` |
| `skill-set freeze` | Write current HEAD of every skill into `Skillfile.lock` |
| `skill-set add <url> [path]` | Append to `Skillfile`, run install |
| `skill-set fork <name> <your-url>` | Change origin, push current state, continue tracking |

## Open Questions

- Use `commander` for CLI or keep it minimal with `parseArgs` from `node:util`?
- `Skillfile` location: `~/.claude/Skillfile` hardcoded or `--config` flag?
