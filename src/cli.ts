import { join } from "node:path";
import { readSkillfile } from "./config";
import { install } from "./install";
import { freeze } from "./freeze";
import { update } from "./update";
import { fork } from "./fork";

const DEFAULT_CLAUDE_DIR = join(process.env.HOME ?? "~", ".claude");

const HELP = `\
Usage: skill-set <command> [args]

Commands:
  install                   Clone/fetch skills and symlink into ~/.claude/skills/
  update <name>             Fetch and merge upstream changes for a skillset
  freeze                    Pin all skills to their current HEAD in Skillfile.lock
  fork <name> <url>         Change a skillset's origin and push
`;

export async function run(args: string[], claudeDir = DEFAULT_CLAUDE_DIR): Promise<{ output: string; exitCode: number }> {
  const [command] = args;

  if (!command || command === "--help") {
    return { output: HELP, exitCode: 0 };
  }

  switch (command) {
    case "install": {
      const data = await readSkillfile(join(claudeDir, "Skillfile"));
      const count = data.skills.length + data.skillsets.reduce((n, ss) => n + ss.skills.length, 0);
      await install(data, claudeDir);
      return { output: `Installed ${count} skill(s).`, exitCode: 0 };
    }
    case "freeze": {
      const data = await readSkillfile(join(claudeDir, "Skillfile"));
      const count = data.skills.length + data.skillsets.reduce((n, ss) => n + ss.skills.length, 0);
      await freeze(data, claudeDir);
      return { output: `Pinned ${count} skill(s) to Skillfile.lock.`, exitCode: 0 };
    }
    case "update": {
      const [, name] = args;
      if (!name) return { output: "Usage: skill-set update <name>", exitCode: 1 };
      const data = await readSkillfile(join(claudeDir, "Skillfile"));
      try {
        await update(name, data, claudeDir);
        return { output: `Updated ${name}.`, exitCode: 0 };
      } catch (e: any) {
        return { output: e.message, exitCode: 1 };
      }
    }
    case "fork": {
      const [, name, newOrigin] = args;
      if (!name || !newOrigin) return { output: "Usage: skill-set fork <name> <url>", exitCode: 1 };
      try {
        await fork(name, newOrigin, claudeDir);
        return { output: `Forked ${name} to ${newOrigin}.`, exitCode: 0 };
      } catch (e: any) {
        return { output: e.message, exitCode: 1 };
      }
    }
    default:
      return { output: `Unknown command: ${command}\n\n${HELP}`, exitCode: 1 };
  }
}

if (import.meta.main) {
  const { output, exitCode } = await run(process.argv.slice(2));
  console.log(output);
  process.exit(exitCode);
}
