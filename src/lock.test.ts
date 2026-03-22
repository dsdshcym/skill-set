import { describe, it, expect } from "bun:test";
import { parseLockfile, serializeLockfile } from "./lock";

describe("parseLockfile", () => {
  it("parses pins", () => {
    const pins = parseLockfile(`[pins]\nmy-skill = "abc1234"\nother = "def5678"\n`);
    expect(pins["my-skill"]).toBe("abc1234");
    expect(pins["other"]).toBe("def5678");
  });

  it("returns empty object for empty file", () => {
    expect(parseLockfile("")).toEqual({});
  });
});

describe("serializeLockfile", () => {
  it("round-trips through parse", () => {
    const pins = { "my-skill": "abc1234", other: "def5678" };
    expect(parseLockfile(serializeLockfile(pins))).toEqual(pins);
  });
});
