import { describe, expect, it } from "vite-plus/test";
import {
  changesSummary,
  doneMeta,
  needsYouCopy,
  replySummary,
  shipped,
  toolResultText,
} from "@/lib/agent-toasts";

const task = { title: "Fix login", project: "nex", branch: "fix/login", worktreePath: "/w" };
const request = (tool: string, input: Record<string, unknown>) => ({
  id: "r1",
  sessionId: "s1",
  tool,
  input,
  canRemember: true,
  at: "",
});

describe("needsYouCopy", () => {
  it("shows the command a permission is for", () => {
    expect(needsYouCopy(request("Bash", { command: "rm -rf dist" }), task)).toEqual({
      meta: "nex · fix/login",
      title: "Fix login",
      body: "Wants to run a command",
      code: "rm -rf dist",
      answerable: true,
    });
  });

  it("only opens the task for a question", () => {
    const copy = needsYouCopy(
      request("AskUserQuestion", { questions: [{ question: "Which database?" }] }),
      task,
    );
    expect(copy).toMatchObject({ body: "Has a question", code: "Which database?" });
    expect(copy.answerable).toBe(false);
  });

  it("names the plan", () => {
    const copy = needsYouCopy(request("ExitPlanMode", { plan: "# Move auth\n..." }), task);
    expect(copy).toMatchObject({ body: "Has a plan ready", code: "Move auth", answerable: false });
  });
});

describe("summaries", () => {
  it("counts the changed files and lines", () => {
    expect(
      changesSummary([
        { added: 10, removed: 2 },
        { added: 3, removed: 0 },
      ]),
    ).toBe("2 files changed · +13 −2");
    expect(changesSummary([])).toBe("");
  });

  it("keeps the first line of the reply", () => {
    expect(replySummary("Done.\nMore detail")).toBe("Done.");
    expect(replySummary(undefined)).toBe("");
  });

  it("adds the turn length to the project", () => {
    expect(doneMeta(task, 14 * 60_000)).toBe("nex · 14 min");
    expect(doneMeta(task, undefined)).toBe("nex");
  });
});

describe("shipped", () => {
  it("finds the pull request a gh command opened", () => {
    expect(shipped('gh pr create --title "Fix"', "https://github.com/acme/app/pull/42\n")).toEqual({
      kind: "pr",
      url: "https://github.com/acme/app/pull/42",
    });
  });

  it("offers GitHub's new pull request link after a push", () => {
    const output =
      "remote: Create a pull request for 'fix' on GitHub by visiting:\nremote:      https://github.com/acme/app/pull/new/fix\n";
    expect(shipped("git push -u origin fix", output)).toEqual({
      kind: "push",
      prUrl: "https://github.com/acme/app/pull/new/fix",
    });
  });

  it("ignores other commands", () => {
    expect(shipped("git status", "")).toBeNull();
  });

  it("reads tool output in either shape", () => {
    expect(
      toolResultText([
        { type: "text", text: "a" },
        { type: "text", text: "b" },
      ]),
    ).toBe("a\nb");
    expect(toolResultText("plain")).toBe("plain");
  });
});
