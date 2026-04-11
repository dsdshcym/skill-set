# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

**Skill-set** is a git-native manager for Claude Code skills. Users declare skills in a `Skillfile` (TOML), and skill-set installs them as live git clones in `~/.claude/skill-repos/`, symlinking into `~/.claude/skills/`. Pinned commits are tracked in `Skillfile.lock` for reproducibility. The design goal is to treat skills like editable, forkable packages rather than static files.

## Commands

```bash
# Run all tests
bun test

# Run a single test file
bun test src/install.test.ts

# Build self-contained binary (no runtime deps for end users)
bun build --compile src/cli.ts --outfile skill-set
```

## Architecture

`src/cli.ts` dispatches subcommands to individual modules. Each command module (`install`, `freeze`, `update`, `add`, `fork`) is self-contained. Shared I/O lives in `config.ts` (Skillfile) and `lock.ts` (Skillfile.lock).

```
cli.ts → install.ts, freeze.ts, update.ts, add.ts, fork.ts
                  ↓
            config.ts (Skillfile TOML)
            lock.ts   (Skillfile.lock TOML)
```

**Runtime directory layout:**
```
~/.claude/
├── Skillfile              # user declarations
├── Skillfile.lock         # auto-generated pins
├── skill-repos/{name}/   # git clones
└── skills/{name}/        # symlinks → repos
```

**Core data model** (`config.ts`):
```typescript
interface Skill {
  name: string;
  origin: string;    // git repo URL
  path: string;      // subpath within repo
  branch?: string;
  pin?: string;      // pinned commit hash
}
```

## Testing Conventions

Tests use Bun's built-in test framework with temporary git repos for isolation (`mkdtemp`). The shared helper `src/test-helpers.ts` provides `setupTestRepo()` and `setupInstalledRepo()`. Each command has a corresponding `*.test.ts` file alongside its implementation.

## Tech Stack

Bun is used for its built-in TypeScript, TOML parsing (`Bun.TOML`), and shell execution (`$` template literal). There are no external npm dependencies. The compiled binary requires no runtime on end-user machines.