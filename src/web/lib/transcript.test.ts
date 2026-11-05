import { describe, expect, it } from "vite-plus/test";
import { describeTool, patchRows, permissionPrompt } from "@/lib/tool-display";
import { buildConversation } from "@/lib/transcript";

const user = (content: unknown, extra: object = {}) => ({
  type: "user",
  uuid: crypto.randomUUID(),
  message: { content },
  ...extra,
});
const assistant = (content: unknown[]) => ({
  type: "assistant",
  uuid: crypto.randomUUID(),
  message: { content },
});
const toolUse = (id: string, name: string, input: object) => ({
  type: "tool_use",
  id,
  name,
  input,
});
const toolResult = (id: string, content: string, isError = false) => ({
  type: "tool_result",
  tool_use_id: id,
  content,
  is_error: isError,
});

describe("buildConversation", () => {
  it("turns prompts, replies and tool calls into items with their results", () => {
    const items = buildConversation([
      user("Fix the login redirect"),
      assistant([{ type: "text", text: "Looking at it." }]),
      assistant([toolUse("t1", "Bash", { command: "yarn test" })]),
      user([toolResult("t1", "4 passed")], { toolUseResult: { stdout: "4 passed" } }),
    ]);
    expect(items.map((item) => item.kind)).toEqual(["user", "text", "tool"]);
    const tool = items[2];
    expect(tool.kind === "tool" && tool.call.result?.data).toEqual({ stdout: "4 passed" });
  });

  it("hides meta and local command messages and marks interruptions", () => {
    const items = buildConversation([
      user("<local-command-stdout>ok</local-command-stdout>"),
      user("Caveat", { isMeta: true }),
      user("<command-name>/review</command-name>"),
      user([{ type: "text", text: "[Request interrupted by user]" }]),
    ]);
    expect(items).toMatchObject([
      { kind: "command", name: "/review" },
      { kind: "divider", label: "Interrupted by you" },
    ]);
  });

  it("shows what a local command printed under it", () => {
    const items = buildConversation([
      user("<command-name>/model</command-name><command-args>opus</command-args>"),
      {
        type: "system",
        subtype: "local_command",
        content: "<local-command-stdout>Set model to opus</local-command-stdout>",
      },
    ]);
    expect(items).toMatchObject([
      { kind: "command", name: "/model opus", output: "Set model to opus" },
    ]);
  });

  it("marks where the conversation was cleared", () => {
    const items = buildConversation([user("<command-name>/clear</command-name>")]);
    expect(items).toMatchObject([{ kind: "divider", label: "Conversation cleared" }]);
  });

  it("keeps one plan that updates in place", () => {
    const items = buildConversation([
      assistant([toolUse("a", "TodoWrite", { todos: [{ content: "One", status: "pending" }] })]),
      assistant([{ type: "text", text: "Working" }]),
      assistant([toolUse("b", "TodoWrite", { todos: [{ content: "One", status: "completed" }] })]),
    ]);
    expect(items).toMatchObject([
      { kind: "todos", todos: [{ label: "One", status: "completed" }] },
      { kind: "text" },
    ]);
  });

  it("groups reads that follow each other", () => {
    const items = buildConversation([
      assistant([toolUse("r1", "Read", { file_path: "/w/a.ts" })]),
      user([toolResult("r1", "a")]),
      assistant([toolUse("r2", "Read", { file_path: "/w/b.ts" })]),
      user([toolResult("r2", "b")]),
    ]);
    expect(items).toHaveLength(1);
    expect(items[0].kind === "reads" && items[0].calls.length).toBe(2);
  });
});

describe("describeTool", () => {
  it("shows an edit with its diff, relative to the worktree", () => {
    const display = describeTool(
      {
        id: "e",
        name: "Edit",
        input: { file_path: "/w/src/a.ts" },
        result: {
          text: "ok",
          isError: false,
          data: {
            structuredPatch: [{ oldStart: 3, newStart: 3, lines: [" keep", "-old", "+new"] }],
          },
        },
      },
      "/w",
    );
    expect(display).toMatchObject({
      verb: "Edit",
      target: "src/a.ts",
      diff: { added: 1, removed: 1 },
    });
  });

  it("opens a failed command with its exit code", () => {
    const display = describeTool(
      {
        id: "b",
        name: "Bash",
        input: { command: "yarn typecheck" },
        result: { text: "Exit code 2\nerror TS2322", isError: true, data: null },
      },
      "/w",
    );
    expect(display).toMatchObject({ meta: "exit 2", metaTone: "red", openByDefault: true });
  });

  it("numbers diff rows from the hunk start", () => {
    expect(patchRows([{ oldStart: 10, newStart: 10, lines: [" a", "-b", "+c", " d"] }])).toEqual([
      { n: 10, sign: " ", code: "a" },
      { n: 11, sign: "-", code: "b" },
      { n: 11, sign: "+", code: "c" },
      { n: 12, sign: " ", code: "d" },
    ]);
  });
});

describe("permissionPrompt", () => {
  it("offers to always allow the program of a command", () => {
    expect(permissionPrompt("Bash", { command: "psql $URL -c 'select 1'" }, "/w")).toMatchObject({
      alwaysLabel: "Always allow psql",
    });
  });
});

describe("buildConversation extras", () => {
  it("joins the compact boundary with its summary", () => {
    const items = buildConversation([
      {
        type: "system",
        subtype: "compact_boundary",
        uuid: "b",
        compactMetadata: { preTokens: 182_000, postTokens: 24_000 },
      },
      { type: "user", uuid: "s", isCompactSummary: true, message: { content: "Summary here" } },
    ]);
    expect(items).toEqual([
      { kind: "compacted", id: "b", before: 182_000, after: 24_000, summary: "Summary here" },
    ]);
  });

  it("groups agents started together", () => {
    const items = buildConversation([
      {
        type: "assistant",
        uuid: "a",
        message: {
          content: [
            { type: "tool_use", id: "t1", name: "Task", input: { description: "One" } },
            { type: "tool_use", id: "t2", name: "Task", input: { description: "Two" } },
          ],
        },
      },
    ]);
    expect(items).toHaveLength(1);
    expect(items[0].kind).toBe("agents");
  });
});
