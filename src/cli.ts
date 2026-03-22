const HELP = `\
Usage: skillstow <command> [args]

Commands:
  install                   Clone/fetch skills and symlink into ~/.claude/skills/
  update <name>             Fetch and merge upstream changes for a skill
  freeze                    Pin all skills to their current HEAD in Skillfile.lock
  add <url> [path]          Add a new skill and install it
  fork <name> <url>         Change a skill's origin and push
`;

export function run(args: string[]): { output: string; exitCode: number } {
  const [command, ...rest] = args;

  if (!command || command === "--help") {
    return { output: HELP, exitCode: 0 };
  }

  switch (command) {
    case "install":
      return { output: "install: not yet implemented", exitCode: 0 };
    case "freeze":
      return { output: "freeze: not yet implemented", exitCode: 0 };
    case "update":
      return { output: "update: not yet implemented", exitCode: 0 };
    case "add":
      return { output: "add: not yet implemented", exitCode: 0 };
    case "fork":
      return { output: "fork: not yet implemented", exitCode: 0 };
    default:
      return { output: `Unknown command: ${command}\n\n${HELP}`, exitCode: 1 };
  }
}

if (import.meta.main) {
  const { output, exitCode } = run(process.argv.slice(2));
  console.log(output);
  process.exit(exitCode);
}
