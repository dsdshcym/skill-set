import { describe, it, expect } from "bun:test";
import { parseLockfile, serializeLockfile } from "./lock";

describe("parseLockfile", () => {
  it("parses [[skill]] entries with skillset field", () => {
    const skills = parseLockfile(`
[[skill]]
name     = "brainstorming"
origin   = "https://github.com/someone/superpowers"
path     = "skills/brainstorming"
pin      = "abc1234"
skillset = "superpowers"

[[skill]]
name     = "debugging"
origin   = "https://github.com/someone/superpowers"
path     = "skills/debugging"
pin      = "abc1234"
skillset = "superpowers"
`);
    expect(skills).toHaveLength(2);
    expect(skills[0]).toEqual({
      name: "brainstorming",
      origin: "https://github.com/someone/superpowers",
      path: "skills/brainstorming",
      pin: "abc1234",
      skillset: "superpowers",
    });
    expect(skills[1]).toEqual({
      name: "debugging",
      origin: "https://github.com/someone/superpowers",
      path: "skills/debugging",
      pin: "abc1234",
      skillset: "superpowers",
    });
  });

  it("returns empty array for empty file", () => {
    expect(parseLockfile("")).toEqual([]);
  });
});

describe("serializeLockfile", () => {
  it("round-trips through parse", () => {
    const skills = [
      { name: "brainstorming", origin: "https://example.com/repo", path: "skills/brainstorming", pin: "abc1234", skillset: "superpowers" },
      { name: "tdd", origin: "https://example.com/other", path: "tdd", pin: "def5678", skillset: "tdd" },
    ];
    expect(parseLockfile(serializeLockfile(skills))).toEqual(skills);
  });
});
