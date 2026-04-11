# Implementation Plan

Each step is independently runnable and adds real value.

## Step 1: Scaffold

- `package.json` with `bun build --compile` script
- `src/cli.ts` with argument parsing (hardcode subcommands, no library)
- Prints help and exits cleanly

**Runnable:** `skill-set --help`

## Step 2: `install`

- Parse `~/.claude/Skillfile`
- For each skill: `git clone` into `~/.claude/skill-repos/<repo>/`
- Symlink `~/.claude/skill-repos/<repo>/<path>` → `~/.claude/skills/<name>`
- If skill already cloned, `git fetch` instead

**Runnable:** `skill-set install` — skills appear in `~/.claude/skills/`

## Step 3: `freeze`

- Read current HEAD of each skill-repo clone
- Write pins into `Skillfile.lock`

**Runnable:** `skill-set freeze` — produces a `Skillfile.lock`

## Step 4: `update <name>`

- `git fetch origin` in the skill's repo clone
- Merge upstream into current branch
- Update pin in `Skillfile.lock`

**Runnable:** `skill-set update extract-notes` — pulls latest, updates lock

## Step 5: `add <url> [path]`

- Append new `[[skill]]` entry to `Skillfile`
- Run install for the new skill only

**Runnable:** `skill-set add https://github.com/someone/dotfiles .claude/skills/foo`

## Step 6: `fork <name> <your-url>`

- Update `origin` in `Skillfile` for the named skill
- `git remote set-url origin <your-url>`
- `git push -u origin`

**Runnable:** `skill-set fork extract-notes https://github.com/you/dotfiles`
