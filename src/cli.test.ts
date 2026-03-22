import { describe, it, expect } from "bun:test";
import { run } from "./cli";

describe("run", () => {
  it("prints help with no args", () => {
    const { output, exitCode } = run([]);
    expect(exitCode).toBe(0);
    expect(output).toContain("Usage:");
    expect(output).toContain("install");
    expect(output).toContain("update");
    expect(output).toContain("freeze");
    expect(output).toContain("add");
    expect(output).toContain("fork");
  });

  it("prints help with --help", () => {
    const { output, exitCode } = run(["--help"]);
    expect(exitCode).toBe(0);
    expect(output).toContain("Usage:");
  });

  it("exits 1 on unknown command", () => {
    const { output, exitCode } = run(["unknown"]);
    expect(exitCode).toBe(1);
    expect(output).toContain("Unknown command: unknown");
  });

  it("recognizes install", () => {
    const { exitCode } = run(["install"]);
    expect(exitCode).toBe(0);
  });

  it("recognizes freeze", () => {
    const { exitCode } = run(["freeze"]);
    expect(exitCode).toBe(0);
  });

  it("recognizes update <name>", () => {
    const { exitCode } = run(["update", "my-skill"]);
    expect(exitCode).toBe(0);
  });

  it("recognizes add <url>", () => {
    const { exitCode } = run(["add", "https://github.com/foo/bar"]);
    expect(exitCode).toBe(0);
  });

  it("recognizes fork <name> <url>", () => {
    const { exitCode } = run(["fork", "my-skill", "https://github.com/you/bar"]);
    expect(exitCode).toBe(0);
  });
});
