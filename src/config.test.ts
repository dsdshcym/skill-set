import { describe, it, expect } from "bun:test";
import { parseSkillfile } from "./config";

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
});
