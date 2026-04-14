import { describe, it, expect } from "bun:test";
import { parseSkillfile, serializeSkillfile, cloneDirName } from "./config";

describe("parseSkillfile", () => {
  it("parses [[skill]] entries into skills", () => {
    const { skills, skillsets } = parseSkillfile(`
[[skill]]
name   = "extract-notes"
origin = "https://github.com/foo/dotfiles"
path   = ".claude/skills/extract-notes"
`);
    expect(skills).toHaveLength(1);
    expect(skillsets).toHaveLength(0);
    expect(skills[0]).toEqual({
      name: "extract-notes",
      origin: "https://github.com/foo/dotfiles",
      path: ".claude/skills/extract-notes",
    });
  });

  it("parses [[skill]] with empty path (repo-root skill)", () => {
    const { skills } = parseSkillfile(`
[[skill]]
name   = "people"
origin = "https://github.com/dsdshcym/people-skill.git"
`);
    expect(skills[0].path).toBe("");
  });

  it("parses optional branch and pin on [[skill]]", () => {
    const { skills } = parseSkillfile(`
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

  it("parses [[skillset]] entries into skillsets", () => {
    const { skills, skillsets } = parseSkillfile(`
[[skillset]]
name      = "superpowers"
origin    = "https://github.com/someone/superpowers"
root_path = "skills"
skills    = ["brainstorming", "debugging", "tdd"]
`);
    expect(skills).toHaveLength(0);
    expect(skillsets).toHaveLength(1);
    expect(skillsets[0]).toEqual({
      name: "superpowers",
      origin: "https://github.com/someone/superpowers",
      root_path: "skills",
      skills: ["brainstorming", "debugging", "tdd"],
    });
  });

  it("parses [[skillset]] with inline table skill entries", () => {
    const { skillsets } = parseSkillfile(`
[[skillset]]
name      = "tubi:pagerduty"
origin    = "https://github.com/adRise/claude-skills.git"
root_path = "plugins/pagerduty/skills"
skills    = [{ name = "tubi:pagerduty", path = "pagerduty" }]
`);
    expect(skillsets[0].skills).toEqual([{ name: "tubi:pagerduty", path: "pagerduty" }]);
  });

  it("parses [[skillset]] with mixed string and inline table skills", () => {
    const { skillsets } = parseSkillfile(`
[[skillset]]
name      = "my-set"
origin    = "https://github.com/someone/skills"
root_path = "skills"
skills    = ["simple-skill", { name = "custom:name", path = "actual-dir" }]
`);
    expect(skillsets[0].skills).toEqual([
      "simple-skill",
      { name: "custom:name", path: "actual-dir" },
    ]);
  });

  it("[[skillset]] defaults root_path to empty string", () => {
    const { skillsets } = parseSkillfile(`
[[skillset]]
name   = "my-skills"
origin = "https://github.com/someone/skills"
skills = ["foo", "bar"]
`);
    expect(skillsets[0].root_path).toBe("");
  });

  it("[[skillset]] preserves branch and pin", () => {
    const { skillsets } = parseSkillfile(`
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

  it("mixes [[skill]] and [[skillset]]", () => {
    const { skills, skillsets } = parseSkillfile(`
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
    expect(skills).toHaveLength(1);
    expect(skills[0].name).toBe("tdd");
    expect(skillsets).toHaveLength(1);
    expect(skillsets[0].name).toBe("superpowers");
  });

  it("returns empty for empty file", () => {
    const { skills, skillsets } = parseSkillfile("");
    expect(skills).toEqual([]);
    expect(skillsets).toEqual([]);
  });
});

describe("serializeSkillfile", () => {
  it("round-trips [[skill]] entries", () => {
    const input = `[[skill]]
name   = "tdd"
origin = "https://github.com/anthropics/claude-skills"
path   = "tdd"
`;
    const data = parseSkillfile(input);
    expect(parseSkillfile(serializeSkillfile(data))).toEqual(data);
  });

  it("round-trips [[skill]] with empty path", () => {
    const input = `[[skill]]
name   = "people"
origin = "https://github.com/dsdshcym/people-skill.git"
`;
    const data = parseSkillfile(input);
    expect(parseSkillfile(serializeSkillfile(data))).toEqual(data);
  });

  it("round-trips [[skillset]] entries", () => {
    const input = `[[skillset]]
name      = "superpowers"
origin    = "https://github.com/someone/superpowers"
root_path = "skills"
skills    = ["brainstorming", "debugging", "tdd"]
`;
    const data = parseSkillfile(input);
    expect(parseSkillfile(serializeSkillfile(data))).toEqual(data);
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
    const data = parseSkillfile(input);
    expect(parseSkillfile(serializeSkillfile(data))).toEqual(data);
  });

  it("round-trips [[skillset]] with inline table skills", () => {
    const input = `[[skillset]]
name      = "tubi:pagerduty"
origin    = "https://github.com/adRise/claude-skills.git"
root_path = "plugins/pagerduty/skills"
skills    = [{name = "tubi:pagerduty", path = "pagerduty"}]
`;
    const data = parseSkillfile(input);
    expect(parseSkillfile(serializeSkillfile(data))).toEqual(data);
  });

  it("round-trips [[skillset]] with mixed string and inline table skills", () => {
    const input = `[[skillset]]
name      = "my-set"
origin    = "https://github.com/someone/skills"
root_path = "skills"
skills    = ["simple", {name = "custom:name", path = "actual-dir"}]
`;
    const data = parseSkillfile(input);
    expect(parseSkillfile(serializeSkillfile(data))).toEqual(data);
  });

  it("omits path line when path is empty", () => {
    const data = { skills: [{ name: "people", origin: "https://example.com", path: "" }], skillsets: [] };
    const output = serializeSkillfile(data);
    expect(output).toContain("[[skill]]");
    expect(output).not.toContain("path");
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
