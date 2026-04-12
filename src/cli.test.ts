import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "./cli";

describe("run", () => {
  let claudeDir: string;

  beforeEach(async () => {
    claudeDir = await mkdtemp(join(tmpdir(), "skill-set-cli-test-"));
  });

  afterEach(async () => {
    await rm(claudeDir, { recursive: true });
  });

  it("prints help with no args", async () => {
    const { output, exitCode } = await run([], claudeDir);
    expect(exitCode).toBe(0);
    expect(output).toContain("Usage:");
    expect(output).toContain("install");
    expect(output).toContain("update");
    expect(output).toContain("freeze");
    expect(output).toContain("fork");
  });

  it("prints help with --help", async () => {
    const { output, exitCode } = await run(["--help"], claudeDir);
    expect(exitCode).toBe(0);
    expect(output).toContain("Usage:");
  });

  it("exits 1 on unknown command", async () => {
    const { output, exitCode } = await run(["unknown"], claudeDir);
    expect(exitCode).toBe(1);
    expect(output).toContain("Unknown command: unknown");
  });

  it("install with empty Skillfile reports 0 skills", async () => {
    const { output, exitCode } = await run(["install"], claudeDir);
    expect(exitCode).toBe(0);
    expect(output).toContain("0 skill");
  });

  it("freeze with empty Skillfile reports 0 skills", async () => {
    const { output, exitCode } = await run(["freeze"], claudeDir);
    expect(exitCode).toBe(0);
    expect(output).toContain("0 skill");
  });

  it("exits 1 when update skill not found", async () => {
    const { output, exitCode } = await run(["update", "nonexistent"], claudeDir);
    expect(exitCode).toBe(1);
    expect(output).toContain("nonexistent");
  });

  it("exits 1 when fork skill not found", async () => {
    const { output, exitCode } = await run(["fork", "nonexistent", "https://example.com/x"], claudeDir);
    expect(exitCode).toBe(1);
    expect(output).toContain("nonexistent");
  });

  it("exits 1 when new has no name", async () => {
    const { output, exitCode } = await run(["new"], claudeDir);
    expect(exitCode).toBe(1);
    expect(output).toContain("Usage:");
  });

  it("new creates standalone skill and prints path", async () => {
    const { output, exitCode } = await run(["new", "my-skill"], claudeDir);
    expect(exitCode).toBe(0);
    expect(output).toContain(join(claudeDir, "skill-repos", "my-skill"));
  });

  it("exits 1 when new --in references unknown skillset", async () => {
    const { output, exitCode } = await run(["new", "x", "--in", "nope"], claudeDir);
    expect(exitCode).toBe(1);
    expect(output).toContain("nope");
  });
});
