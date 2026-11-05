import { describe, expect, it } from "vite-plus/test";
import { dedent, describeTool } from "@/lib/tool-display";

const bash = (input: Record<string, unknown>, data: Record<string, unknown>, isError = false) =>
  describeTool(
    {
      id: "1",
      name: "Bash",
      input,
      result: { text: isError ? "Exit code 2" : "", isError, data },
      startedAt: "2026-11-03T10:00:00.000Z",
      endedAt: "2026-11-03T10:00:03.200Z",
    },
    "/repo",
  );

describe("describeTool", () => {
  it("shows the command under a described run and how long it took", () => {
    const display = bash({ command: "yarn test", description: "Run the tests" }, { stdout: "ok" });
    expect(display.note).toEqual({ text: "yarn test", mono: true });
    expect(display.meta).toBe("✓ 3.2s");
    expect(display.metaTone).toBe("green");
  });

  it("turns a commit into a commit row", () => {
    const display = bash(
      { command: 'git commit -m "Fix logout"' },
      { stdout: "[main a3f9c21b] Fix logout\n 3 files changed, 4 insertions(+)" },
    );
    expect(display).toMatchObject({ verb: "Commit", target: "Fix logout", tag: "a3f9c21" });
    expect(display.meta).toBe("3 files");
  });

  it("finds the pull request a gh command opened", () => {
    const display = bash(
      { command: 'gh pr create --title "Use safeNext" --body x' },
      { stdout: "https://github.com/acme/app/pull/128\n" },
    );
    expect(display.pullRequest).toEqual({
      title: "Use safeNext",
      number: 128,
      url: "https://github.com/acme/app/pull/128",
      branch: undefined,
      base: undefined,
    });
  });

  it("reads the branch a pull request was opened from", () => {
    const display = bash(
      {
        command:
          'git checkout -b prueba-nex && git push -u origin prueba-nex && gh pr create --title "x" --base main',
      },
      { stdout: "https://github.com/acme/app/pull/9" },
    );
    expect(display.pullRequest).toMatchObject({ branch: "prueba-nex", base: "main" });
  });

  it("marks what you denied", () => {
    const display = describeTool(
      {
        id: "1",
        name: "Edit",
        input: { file_path: "/repo/a.ts" },
        result: { text: "The user denied this.", isError: true, data: null },
      },
      "/repo",
    );
    expect(display).toMatchObject({ verb: "Denied", icon: "denied", meta: "by you" });
  });

  it("lists grep matches with their location", () => {
    const display = describeTool(
      {
        id: "1",
        name: "Grep",
        input: { pattern: "safeNext" },
        result: {
          text: "",
          isError: false,
          data: { mode: "content", content: "/repo/src/url.ts:12:export function safeNext()" },
        },
      },
      "/repo",
    );
    expect(display.detail).toEqual({
      kind: "matches",
      term: "safeNext",
      matches: [{ location: "src/url.ts:12", line: "export function safeNext()" }],
    });
  });
});

describe("dedent", () => {
  it("removes the indentation every line shares", () => {
    expect(dedent(["    a", "      b", "", "    c"])).toEqual(["a", "  b", "", "c"]);
  });
});
