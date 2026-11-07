import { describe, expect, it } from "vite-plus/test";
import { dedent, describeTool, lineDiff } from "@/lib/tool-display";

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

describe("hook blocked commits", () => {
  it("shows the hook and its message instead of a failed command", () => {
    const display = bash(
      { command: 'git commit -m "Fix logout"' },
      {
        stdout: "",
        stderr:
          "✔ Preparing lint-staged...\n✖ eslint --fix:\n  src/a.ts  error  'x' is unused\nhusky - pre-commit script failed (code 1)",
      },
      true,
    );
    expect(display).toMatchObject({
      icon: "commit",
      tone: "red",
      verb: "Hook blocked commit",
      target: "pre-commit",
      note: { text: "✖ eslint --fix:" },
    });
  });

  it("keeps an ordinary failed commit as a failed command", () => {
    const display = bash(
      { command: "git commit -m x" },
      { stdout: "nothing to commit, working tree clean" },
      true,
    );
    expect(display.verb).toBe("Run");
  });
});

describe("notebook edits", () => {
  const notebook = JSON.stringify({
    cells: [
      { id: "a1", source: ["import pandas as pd\n"] },
      { id: "b2", source: ["df = pd.read_csv('x.csv')\n", "df.head()"] },
    ],
  });
  const edit = (input: Record<string, unknown>) =>
    describeTool(
      {
        id: "1",
        name: "NotebookEdit",
        input: { notebook_path: "/repo/analysis.ipynb", ...input },
        result: { text: "", isError: false, data: { original_file: notebook } },
      },
      "/repo",
    );

  it("shows the cell and how many lines changed", () => {
    const display = edit({ cell_id: "b2", new_source: "df = pd.read_csv('y.csv')\ndf.head()" });
    expect(display).toMatchObject({
      verb: "Edit",
      target: "analysis.ipynb",
      tag: "cell 2",
      diff: { added: 1, removed: 1 },
    });
  });

  it("counts an inserted cell as added lines", () => {
    const display = edit({ cell_id: "a1", edit_mode: "insert", new_source: "x = 1\ny = 2" });
    expect(display).toMatchObject({ verb: "Add cell to", tag: "cell 2", diff: { added: 2 } });
  });
});

describe("lineDiff", () => {
  it("keeps shared lines and marks the rest", () => {
    expect(lineDiff(["a", "b", "c"], ["a", "x", "c"]).map((row) => row.sign)).toEqual([
      " ",
      "+",
      "-",
      " ",
    ]);
  });
});

describe("dedent", () => {
  it("removes the indentation every line shares", () => {
    expect(dedent(["    a", "      b", "", "    c"])).toEqual(["a", "  b", "", "c"]);
  });
});
