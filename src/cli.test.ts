import { describe, it, expect } from "bun:test";
import { run } from "./cli";

describe("run", () => {
  it("prints help with no args", async () => {
    const { output, exitCode } = await run([]);
    expect(exitCode).toBe(0);
    expect(output).toContain("Usage:");
    expect(output).toContain("install");
    expect(output).toContain("update");
    expect(output).toContain("freeze");
    expect(output).toContain("add");
    expect(output).toContain("fork");
  });

  it("prints help with --help", async () => {
    const { output, exitCode } = await run(["--help"]);
    expect(exitCode).toBe(0);
    expect(output).toContain("Usage:");
  });

  it("exits 1 on unknown command", async () => {
    const { output, exitCode } = await run(["unknown"]);
    expect(exitCode).toBe(1);
    expect(output).toContain("Unknown command: unknown");
  });

  it("recognizes install", async () => {
    const { exitCode } = await run(["install"]);
    expect(exitCode).toBe(0);
  });

  it("recognizes freeze", async () => {
    const { exitCode } = await run(["freeze"]);
    expect(exitCode).toBe(0);
  });

  it("recognizes update <name>", async () => {
    const { exitCode } = await run(["update", "my-skill"]);
    expect(exitCode).toBe(0);
  });

  it("recognizes add <url>", async () => {
    const { exitCode } = await run(["add", "https://github.com/foo/bar"]);
    expect(exitCode).toBe(0);
  });

  it("recognizes fork <name> <url>", async () => {
    const { exitCode } = await run(["fork", "my-skill", "https://github.com/you/bar"]);
    expect(exitCode).toBe(0);
  });
});
