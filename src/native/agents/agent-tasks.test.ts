import { describe, expect, it } from "vite-plus/test";
import { applyAgentTaskEvent, endAgentTasks, type AgentTask } from "@native/agents/agent-tasks";

const run = (events: Record<string, unknown>[]) =>
  events.reduce<readonly AgentTask[]>(
    (tasks, event) => applyAgentTaskEvent(tasks, event, 1000),
    [],
  );

const system = (subtype: string, fields: Record<string, unknown>) => ({
  type: "system",
  subtype,
  task_id: "t1",
  ...fields,
});

const AGENT_STARTED = system("task_started", {
  tool_use_id: "toolu_1",
  description: "Count lines in a.txt",
  subagent_type: "general-purpose",
  is_backgrounded: true,
  task_type: "local_agent",
});

const WORKFLOW_PROGRESS = [
  { type: "workflow_phase", index: 1, title: "Words", detail: "two agents" },
  {
    type: "workflow_agent",
    label: "apple",
    phaseTitle: "Words",
    state: "done",
    model: "haiku",
    tokens: 20252,
    toolCalls: 0,
  },
  {
    type: "workflow_agent",
    label: "pear",
    phaseTitle: "Words",
    state: "start",
    model: "haiku",
    tokens: 0,
    toolCalls: 0,
  },
];

describe("applyAgentTaskEvent", () => {
  it("tracks a background subagent from start to its notification", () => {
    const [task] = run([
      AGENT_STARTED,
      system("task_progress", {
        description: "Running Count lines",
        usage: { total_tokens: 20872, tool_uses: 1 },
        last_tool_name: "Bash",
      }),
      system("task_notification", {
        status: "completed",
        summary: "2",
        usage: { total_tokens: 25674, tool_uses: 1 },
      }),
    ]);
    expect(task).toMatchObject({
      kind: "agent",
      toolUseId: "toolu_1",
      name: "general-purpose",
      background: true,
      status: "completed",
      activity: "Running Count lines",
      lastTool: "Bash",
      tokens: 25674,
      toolUses: 1,
      summary: "2",
    });
  });

  it("reads a workflow's phases and agents from its progress", () => {
    const [task] = run([
      system("task_started", {
        task_type: "local_workflow",
        workflow_name: "apple-pear",
        description: "Two agents",
      }),
      system("task_progress", { workflow_progress: WORKFLOW_PROGRESS }),
    ]);
    expect(task?.kind).toBe("workflow");
    expect(task?.name).toBe("apple-pear");
    expect(task?.phases).toEqual([{ title: "Words", detail: "two agents" }]);
    expect(task?.agents.map((agent) => [agent.label, agent.state])).toEqual([
      ["apple", "done"],
      ["pear", "running"],
    ]);
  });

  it("marks a killed task as stopped", () => {
    const [task] = run([AGENT_STARTED, system("task_updated", { patch: { status: "killed" } })]);
    expect(task?.status).toBe("stopped");
  });

  it("ignores background shell commands", () => {
    expect(run([system("task_started", { task_type: "local_bash" })])).toEqual([]);
  });

  it("stops whatever was still running when the agent exits", () => {
    expect(endAgentTasks(run([AGENT_STARTED]))[0]?.status).toBe("stopped");
  });
});
