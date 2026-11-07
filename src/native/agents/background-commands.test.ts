import { describe, expect, it } from "vite-plus/test";
import {
  NO_BACKGROUND,
  applyBackgroundEvent,
  type BackgroundState,
} from "@native/agents/background-commands";

const startBash = (id: string, command: string, description = "") => ({
  type: "assistant",
  message: {
    content: [
      {
        type: "tool_use",
        id,
        name: "Bash",
        input: { command, description, run_in_background: true },
      },
    ],
  },
});

const result = (toolUseId: string, content: string, extra: Record<string, unknown> = {}) => ({
  type: "user",
  message: { content: [{ type: "tool_result", tool_use_id: toolUseId, content }] },
  ...extra,
});

const run = (events: Record<string, unknown>[], state: BackgroundState = NO_BACKGROUND) =>
  events.reduce((current, event) => applyBackgroundEvent(current, event, 1000), state);

describe("applyBackgroundEvent", () => {
  it("follows the order Claude Code emits a background command in", () => {
    const state = run([
      startBash("toolu_1", "pnpm dev", "Start the dev server"),
      {
        type: "system",
        subtype: "background_tasks_changed",
        tasks: [{ task_id: "b1", task_type: "local_bash", description: "Start the dev server" }],
      },
      {
        type: "system",
        subtype: "task_started",
        task_id: "b1",
        tool_use_id: "toolu_1",
        description: "Start the dev server",
        task_type: "local_bash",
      },
      result("toolu_1", "Command running in background with ID: b1.", {
        tool_use_result: { backgroundTaskId: "b1" },
      }),
    ]);
    expect(state.commands).toEqual([
      { id: "b1", command: "pnpm dev", description: "Start the dev server", startedAt: 1000 },
    ]);
    expect(state.requested).toEqual({});
  });

  it("falls back to the tool result when no task events arrive", () => {
    const state = run([
      startBash("toolu_1", "sleep 30"),
      result("toolu_1", "Command running in background with ID: bash_1. Output is…"),
    ]);
    expect(state.commands.map((command) => [command.id, command.command])).toEqual([
      ["bash_1", "sleep 30"],
    ]);
  });

  it("ignores a background command that failed to start", () => {
    const state = run([
      startBash("toolu_1", "pnpm dev"),
      {
        type: "user",
        message: {
          content: [{ type: "tool_result", tool_use_id: "toolu_1", content: "no", is_error: true }],
        },
      },
    ]);
    expect(state.commands).toEqual([]);
  });

  const started = run([
    startBash("toolu_1", "pnpm dev"),
    result("toolu_1", "Command running in background with ID: b1."),
  ]);

  it.each([
    ["a task notification", { type: "system", subtype: "task_notification", task_id: "b1" }],
    [
      "a finished task update",
      { type: "system", subtype: "task_updated", task_id: "b1", patch: { status: "completed" } },
    ],
    ["an emptied task list", { type: "system", subtype: "background_tasks_changed", tasks: [] }],
    [
      "a notification in the conversation",
      {
        type: "user",
        message: {
          content: "<task-notification>\n<task-id>b1</task-id>\n<status>killed</status>",
        },
      },
    ],
  ])("drops the command on %s", (_, event) => {
    expect(applyBackgroundEvent(started, event).commands).toEqual([]);
  });

  it("drops the command once Claude stops it", () => {
    const state = run(
      [
        {
          type: "assistant",
          message: {
            content: [
              { type: "tool_use", id: "toolu_2", name: "TaskStop", input: { task_id: "b1" } },
            ],
          },
        },
        result("toolu_2", '{"message":"Successfully stopped task: b1"}'),
      ],
      started,
    );
    expect(state.commands).toEqual([]);
  });

  it("keeps other kinds of background tasks out", () => {
    const state = run([
      {
        type: "system",
        subtype: "background_tasks_changed",
        tasks: [{ task_id: "a1", task_type: "local_agent", description: "Explore" }],
      },
    ]);
    expect(state.commands).toEqual([]);
  });

  it("returns the same state for unrelated events", () => {
    expect(applyBackgroundEvent(started, { type: "stream_event" })).toBe(started);
    expect(applyBackgroundEvent(started, { type: "system", subtype: "init" })).toBe(started);
  });
});
