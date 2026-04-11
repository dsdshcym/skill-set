import { describe, it, expect } from "bun:test";
import { parseSkillfile, cloneDirName } from "./config";

describe("parseSkillfile", () => {
  it("parses a single skill", () => {
    const skills = parseSkillfile(`
[[skill]]
name   = "extract-notes"
origin = "https://github.com/foo/dotfiles"
path   = ".claude/skills/extract-notes"
`);
    expect(skills).toHaveLength(1);
    expect(skills[0]).toEqual({
      name: "extract-notes",
      origin: "https://github.com/foo/dotfiles",
      path: ".claude/skills/extract-notes",
      skillset: "extract-notes",
    });
  });

  it("parses multiple skills", () => {
    const skills = parseSkillfile(`
[[skill]]
name   = "foo"
origin = "https://github.com/foo/bar"
path   = ".claude/skills/foo"

[[skill]]
name   = "baz"
origin = "https://github.com/foo/bar"
path   = ".claude/skills/baz"
`);
    expect(skills).toHaveLength(2);
    expect(skills[0].name).toBe("foo");
    expect(skills[1].name).toBe("baz");
  });

  it("parses optional branch and pin", () => {
    const skills = parseSkillfile(`
[[skill]]
name   = "foo"
origin = "https://github.com/foo/bar"
path   = ".claude/skills/foo"
branch = "main"
pin    = "abc1234"
`);
    expect(skills[0].branch).toBe("main");
    expect(skills[0].pin).toBe("abc1234");
  });

  it("returns empty array for empty file", () => {
    expect(parseSkillfile("")).toEqual([]);
  });

  it("sets skillset to skill name for [[skill]] entries", () => {
    const skills = parseSkillfile(`
[[skill]]
name   = "tdd"
origin = "https://github.com/anthropics/claude-skills"
path   = "tdd"
`);
    expect(skills[0].skillset).toBe("tdd");
  });

  it("parses [[skillset]] expanding into multiple skills", () => {
    const skills = parseSkillfile(`
[[skillset]]
name      = "superpowers"
origin    = "https://github.com/someone/superpowers"
root_path = "skills"
skills    = ["brainstorming", "debugging", "tdd"]
`);
    expect(skills).toHaveLength(3);
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
    expect(skills[2]).toEqual({
      name: "tdd",
      origin: "https://github.com/someone/superpowers",
      path: "skills/tdd",
      skillset: "superpowers",
    });
  });

  it("[[skillset]] with empty root_path uses skill name as path", () => {
    const skills = parseSkillfile(`
[[skillset]]
name   = "my-skills"
origin = "https://github.com/someone/skills"
skills = ["foo", "bar"]
`);
    expect(skills[0].path).toBe("foo");
    expect(skills[1].path).toBe("bar");
  });

  it("[[skillset]] with explicit root_path prefixes paths", () => {
    const skills = parseSkillfile(`
[[skillset]]
name      = "dotfiles-skills"
origin    = "https://github.com/me/dotfiles"
root_path = ".claude/skills"
skills    = ["extract-notes", "extract-notes-review"]
`);
    expect(skills[0].path).toBe(".claude/skills/extract-notes");
    expect(skills[1].path).toBe(".claude/skills/extract-notes-review");
  });

  it("mixes [[skill]] and [[skillset]] entries", () => {
    const skills = parseSkillfile(`
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
    expect(skills).toHaveLength(3);
    expect(skills[0].skillset).toBe("tdd");
    expect(skills[1].skillset).toBe("superpowers");
    expect(skills[2].skillset).toBe("superpowers");
  });

  it("[[skillset]] inherits branch and pin", () => {
    const skills = parseSkillfile(`
[[skillset]]
name      = "superpowers"
origin    = "https://github.com/someone/superpowers"
root_path = "skills"
skills    = ["brainstorming", "debugging"]
branch    = "main"
pin       = "abc1234"
`);
    expect(skills[0].branch).toBe("main");
    expect(skills[0].pin).toBe("abc1234");
    expect(skills[1].branch).toBe("main");
    expect(skills[1].pin).toBe("abc1234");
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
