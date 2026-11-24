import { describe, expect, it } from "vite-plus/test";
import type { AgentTask } from "@native/agents/agent-tasks";
import { agentTaskMeta, workflowMeta, workflowPhases } from "@/lib/agent-task-display";

const TASK: AgentTask = {
  id: "w1",
  toolUseId: "toolu_1",
  kind: "workflow",
  name: "review",
  description: "Review the diff",
  background: true,
  status: "running",
  startedAt: 0,
  endedAt: null,
  activity: "",
  lastTool: "",
  tokens: 41_000,
  toolUses: 3,
  summary: "",
  phases: [
    { title: "Find", detail: "" },
    { title: "Verify", detail: "" },
  ],
  agents: [
    { label: "bugs", phase: "Find", state: "done", model: "", tokens: 20_000, toolUses: 2 },
    { label: "perf", phase: "Find", state: "running", model: "", tokens: 0, toolUses: 0 },
  ],
};

describe("workflow display", () => {
  it("counts finished agents while it runs", () => {
    expect(workflowMeta(TASK, 80_000)).toBe("1 of 2 agents · 41k tokens · 1m 20s");
  });

  it("groups agents under their phase and drops empty phases", () => {
    expect(workflowPhases(TASK)).toEqual([
      {
        title: "Find",
        agents: [
          { label: "bugs", state: "done", meta: "20k tokens" },
          { label: "perf", state: "running", meta: "" },
        ],
      },
    ]);
  });
});

describe("agentTaskMeta", () => {
  it("says a subagent runs in the background", () => {
    expect(agentTaskMeta({ ...TASK, kind: "agent", tokens: 0 }, 2_000)).toBe(
      "in background · 3 tools · 2.0s",
    );
  });
});
