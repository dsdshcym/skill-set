import { join } from "node:path";
import { readSkillfile } from "./config";
import { install } from "./install";
import { freeze } from "./freeze";

const CLAUDE_DIR = join(process.env.HOME ?? "~", ".claude");

const HELP = `\
Usage: skillstow <command> [args]

Commands:
  install                   Clone/fetch skills and symlink into ~/.claude/skills/
  update <name>             Fetch and merge upstream changes for a skill
  freeze                    Pin all skills to their current HEAD in Skillfile.lock
  add <url> [path]          Add a new skill and install it
  fork <name> <url>         Change a skill's origin and push
`;

export async function run(args: string[]): Promise<{ output: string; exitCode: number }> {
  const [command] = args;

  if (!command || command === "--help") {
    return { output: HELP, exitCode: 0 };
  }

  switch (command) {
    case "install": {
      const skills = await readSkillfile(join(CLAUDE_DIR, "Skillfile"));
      await install(skills, CLAUDE_DIR);
      return { output: `Installed ${skills.length} skill(s).`, exitCode: 0 };
    }
    case "freeze": {
      const skills = await readSkillfile(join(CLAUDE_DIR, "Skillfile"));
      await freeze(skills, CLAUDE_DIR);
      return { output: `Pinned ${skills.length} skill(s) to Skillfile.lock.`, exitCode: 0 };
    }
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
  const { output, exitCode } = await run(process.argv.slice(2));
  console.log(output);
  process.exit(exitCode);
}
