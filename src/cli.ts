import { join } from "node:path";
import { readSkillfile } from "./config";
import { install } from "./install";
import { freeze } from "./freeze";
import { update } from "./update";
import { add } from "./add";
import { fork } from "./fork";

const DEFAULT_CLAUDE_DIR = join(process.env.HOME ?? "~", ".claude");

const HELP = `\
Usage: skillstow <command> [args]

Commands:
  install                   Clone/fetch skills and symlink into ~/.claude/skills/
  update <name>             Fetch and merge upstream changes for a skill
  freeze                    Pin all skills to their current HEAD in Skillfile.lock
  add <url> [path]          Add a new skill and install it
  fork <name> <url>         Change a skill's origin and push
`;

export async function run(args: string[], claudeDir = DEFAULT_CLAUDE_DIR): Promise<{ output: string; exitCode: number }> {
  const [command] = args;

  if (!command || command === "--help") {
    return { output: HELP, exitCode: 0 };
  }

  switch (command) {
    case "install": {
      const skills = await readSkillfile(join(claudeDir, "Skillfile"));
      await install(skills, claudeDir);
      return { output: `Installed ${skills.length} skill(s).`, exitCode: 0 };
    }
    case "freeze": {
      const skills = await readSkillfile(join(claudeDir, "Skillfile"));
      await freeze(skills, claudeDir);
      return { output: `Pinned ${skills.length} skill(s) to Skillfile.lock.`, exitCode: 0 };
    }
    case "update": {
      const [, name] = args;
      if (!name) return { output: "Usage: skillstow update <name>", exitCode: 1 };
      const skills = await readSkillfile(join(claudeDir, "Skillfile"));
      const skill = skills.find((s) => s.name === name);
      if (!skill) return { output: `Skill "${name}" not found in Skillfile`, exitCode: 1 };
      await update(skill, claudeDir);
      return { output: `Updated ${name}.`, exitCode: 0 };
    }
    case "add": {
      const [, url, path] = args;
      if (!url) return { output: "Usage: skillstow add <url> [path]", exitCode: 1 };
      const skillPath = path ?? ".";
      const name = skillPath === "." ? url.split("/").pop()!.replace(/\.git$/, "") : skillPath.split("/").pop()!;
      await add({ name, origin: url, path: skillPath }, claudeDir);
      return { output: `Added and installed ${name}.`, exitCode: 0 };
    }
    case "fork": {
      const [, name, newOrigin] = args;
      if (!name || !newOrigin) return { output: "Usage: skillstow fork <name> <url>", exitCode: 1 };
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
