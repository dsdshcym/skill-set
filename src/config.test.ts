import { describe, it, expect } from "bun:test";
import { parseSkillfile, flattenSkillsets, serializeSkillfile, cloneDirName, type Skillset } from "./config";

describe("parseSkillfile", () => {
  it("parses a single [[skill]] as a single-skill Skillset", () => {
    const skillsets = parseSkillfile(`
[[skill]]
name   = "extract-notes"
origin = "https://github.com/foo/dotfiles"
path   = ".claude/skills/extract-notes"
`);
    expect(skillsets).toHaveLength(1);
    expect(skillsets[0]).toEqual({
      name: "extract-notes",
      origin: "https://github.com/foo/dotfiles",
      root_path: ".claude/skills",
      skills: ["extract-notes"],
    });
  });

  it("parses [[skill]] with top-level path", () => {
    const skillsets = parseSkillfile(`
[[skill]]
name   = "tdd"
origin = "https://github.com/anthropics/claude-skills"
path   = "tdd"
`);
    expect(skillsets[0]).toEqual({
      name: "tdd",
      origin: "https://github.com/anthropics/claude-skills",
      root_path: "",
      skills: ["tdd"],
    });
  });

  it("parses multiple [[skill]] entries", () => {
    const skillsets = parseSkillfile(`
[[skill]]
name   = "foo"
origin = "https://github.com/foo/bar"
path   = ".claude/skills/foo"

[[skill]]
name   = "baz"
origin = "https://github.com/foo/bar"
path   = ".claude/skills/baz"
`);
    expect(skillsets).toHaveLength(2);
    expect(skillsets[0].name).toBe("foo");
    expect(skillsets[1].name).toBe("baz");
  });

  it("parses optional branch and pin on [[skill]]", () => {
    const skillsets = parseSkillfile(`
[[skill]]
name   = "foo"
origin = "https://github.com/foo/bar"
path   = ".claude/skills/foo"
branch = "main"
pin    = "abc1234"
`);
    expect(skillsets[0].branch).toBe("main");
    expect(skillsets[0].pin).toBe("abc1234");
  });

  it("returns empty array for empty file", () => {
    expect(parseSkillfile("")).toEqual([]);
  });

  it("parses [[skillset]] directly", () => {
    const skillsets = parseSkillfile(`
[[skillset]]
name      = "superpowers"
origin    = "https://github.com/someone/superpowers"
root_path = "skills"
skills    = ["brainstorming", "debugging", "tdd"]
`);
    expect(skillsets).toHaveLength(1);
    expect(skillsets[0]).toEqual({
      name: "superpowers",
      origin: "https://github.com/someone/superpowers",
      root_path: "skills",
      skills: ["brainstorming", "debugging", "tdd"],
    });
  });

  it("[[skillset]] defaults root_path to empty string", () => {
    const skillsets = parseSkillfile(`
[[skillset]]
name   = "my-skills"
origin = "https://github.com/someone/skills"
skills = ["foo", "bar"]
`);
    expect(skillsets[0].root_path).toBe("");
  });

  it("mixes [[skill]] and [[skillset]] entries", () => {
    const skillsets = parseSkillfile(`
[[skill]]
name   = "tdd"
origin = "https://github.com/anthropics/claude-skills"
path   = "tdd"

[[skillset]]
name      = "superpowers"
origin    = "https://github.com/someone/superpowers"
root_path = "skills"
skills    = ["brainstorming", "debugging"]
`);
    expect(skillsets).toHaveLength(2);
    expect(skillsets[0].name).toBe("tdd");
    expect(skillsets[0].skills).toEqual(["tdd"]);
    expect(skillsets[1].name).toBe("superpowers");
    expect(skillsets[1].skills).toEqual(["brainstorming", "debugging"]);
  });

  it("[[skillset]] preserves branch and pin", () => {
    const skillsets = parseSkillfile(`
[[skillset]]
name      = "superpowers"
origin    = "https://github.com/someone/superpowers"
root_path = "skills"
skills    = ["brainstorming", "debugging"]
branch    = "main"
pin       = "abc1234"
`);
    expect(skillsets[0].branch).toBe("main");
    expect(skillsets[0].pin).toBe("abc1234");
  });
});

describe("flattenSkillsets", () => {
  it("expands a single-skill skillset into one Skill", () => {
    const skillsets: Skillset[] = [{
      name: "tdd",
      origin: "https://github.com/anthropics/claude-skills",
      root_path: "",
      skills: ["tdd"],
    }];
    const skills = flattenSkillsets(skillsets);
    expect(skills).toHaveLength(1);
    expect(skills[0]).toEqual({
      name: "tdd",
      origin: "https://github.com/anthropics/claude-skills",
      path: "tdd",
      skillset: "tdd",
    });
  });

  it("expands a multi-skill skillset with root_path", () => {
    const skillsets: Skillset[] = [{
      name: "superpowers",
      origin: "https://github.com/someone/superpowers",
      root_path: "skills",
      skills: ["brainstorming", "debugging"],
    }];
    const skills = flattenSkillsets(skillsets);
    expect(skills).toHaveLength(2);
    expect(skills[0]).toEqual({
      name: "brainstorming",
      origin: "https://github.com/someone/superpowers",
      path: "skills/brainstorming",
      skillset: "superpowers",
    });
    expect(skills[1]).toEqual({
      name: "debugging",
      origin: "https://github.com/someone/superpowers",
      path: "skills/debugging",
      skillset: "superpowers",
    });
  });

  it("expands with empty root_path", () => {
    const skillsets: Skillset[] = [{
      name: "my-skills",
      origin: "https://github.com/someone/skills",
      root_path: "",
      skills: ["foo", "bar"],
    }];
    const skills = flattenSkillsets(skillsets);
    expect(skills[0].path).toBe("foo");
    expect(skills[1].path).toBe("bar");
  });

  it("carries branch and pin to each skill", () => {
    const skillsets: Skillset[] = [{
      name: "superpowers",
      origin: "https://github.com/someone/superpowers",
      root_path: "skills",
      skills: ["brainstorming", "debugging"],
      branch: "main",
      pin: "abc1234",
    }];
    const skills = flattenSkillsets(skillsets);
    expect(skills[0].branch).toBe("main");
    expect(skills[0].pin).toBe("abc1234");
    expect(skills[1].branch).toBe("main");
    expect(skills[1].pin).toBe("abc1234");
  });
});

describe("serializeSkillfile", () => {
  it("round-trips a [[skill]] entry", () => {
    const input = `[[skill]]
name   = "tdd"
origin = "https://github.com/anthropics/claude-skills"
path   = "tdd"
`;
    const skillsets = parseSkillfile(input);
    expect(parseSkillfile(serializeSkillfile(skillsets))).toEqual(skillsets);
  });

  it("round-trips a [[skillset]] entry", () => {
    const input = `[[skillset]]
name      = "superpowers"
origin    = "https://github.com/someone/superpowers"
root_path = "skills"
skills    = ["brainstorming", "debugging", "tdd"]
`;
    const skillsets = parseSkillfile(input);
    expect(parseSkillfile(serializeSkillfile(skillsets))).toEqual(skillsets);
  });

  it("round-trips mixed [[skill]] and [[skillset]]", () => {
    const input = `[[skill]]
name   = "tdd"
origin = "https://github.com/anthropics/claude-skills"
path   = "tdd"

[[skillset]]
name      = "superpowers"
origin    = "https://github.com/someone/superpowers"
root_path = "skills"
skills    = ["brainstorming", "debugging"]
`;
    const skillsets = parseSkillfile(input);
    expect(parseSkillfile(serializeSkillfile(skillsets))).toEqual(skillsets);
  });

  it("writes single-skill skillset as [[skill]]", () => {
    const skillsets: Skillset[] = [{
      name: "tdd",
      origin: "https://github.com/anthropics/claude-skills",
      root_path: "",
      skills: ["tdd"],
    }];
    const output = serializeSkillfile(skillsets);
    expect(output).toContain("[[skill]]");
    expect(output).not.toContain("[[skillset]]");
    expect(output).toContain('path   = "tdd"');
  });

  it("writes multi-skill skillset as [[skillset]]", () => {
    const skillsets: Skillset[] = [{
      name: "superpowers",
      origin: "https://github.com/someone/superpowers",
      root_path: "skills",
      skills: ["brainstorming", "debugging"],
    }];
    const output = serializeSkillfile(skillsets);
    expect(output).toContain("[[skillset]]");
    expect(output).not.toContain("[[skill]]");
    expect(output).toContain('root_path = "skills"');
    expect(output).toContain('skills    = ["brainstorming", "debugging"]');
  });
});

describe("cloneDirName", () => {
  it("returns skillset name when present", () => {
    expect(cloneDirName({ name: "brainstorming", origin: "", path: "", skillset: "superpowers" })).toBe("superpowers");
  });

  it("returns skill name when no skillset", () => {
    expect(cloneDirName({ name: "tdd", origin: "", path: "", skillset: "tdd" })).toBe("tdd");
  });
});
