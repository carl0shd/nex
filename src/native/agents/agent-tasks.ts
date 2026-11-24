export type AgentTaskKind = "agent" | "workflow";
export type AgentTaskStatus = "running" | "completed" | "failed" | "stopped";

export interface WorkflowAgent {
  label: string;
  phase: string;
  state: "queued" | "running" | "done" | "failed" | "skipped";
  model: string;
  tokens: number;
  toolUses: number;
}

export interface WorkflowPhase {
  title: string;
  detail: string;
}

export interface AgentTask {
  id: string;
  toolUseId: string;
  kind: AgentTaskKind;
  name: string;
  description: string;
  background: boolean;
  status: AgentTaskStatus;
  startedAt: number;
  endedAt: number | null;
  activity: string;
  lastTool: string;
  tokens: number;
  toolUses: number;
  summary: string;
  phases: WorkflowPhase[];
  agents: WorkflowAgent[];
}

const KINDS: Record<string, AgentTaskKind> = { local_agent: "agent", local_workflow: "workflow" };
const ENDED: Record<string, AgentTaskStatus> = {
  completed: "completed",
  failed: "failed",
  error: "failed",
  killed: "stopped",
  stopped: "stopped",
  cancelled: "stopped",
};
const AGENT_STATES: Record<string, WorkflowAgent["state"]> = {
  queued: "queued",
  start: "running",
  running: "running",
  done: "done",
  error: "failed",
  failed: "failed",
  skipped: "skipped",
};

const text = (value: unknown) => (typeof value === "string" ? value : "");
const count = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : 0);

interface Usage {
  total_tokens?: unknown;
  tool_uses?: unknown;
}

interface ProgressEntry {
  type?: string;
  title?: unknown;
  detail?: unknown;
  label?: unknown;
  phaseTitle?: unknown;
  state?: unknown;
  model?: unknown;
  tokens?: unknown;
  toolCalls?: unknown;
}

function workflowProgress(entries: unknown): Pick<AgentTask, "phases" | "agents"> | null {
  if (!Array.isArray(entries)) return null;
  const phases: WorkflowPhase[] = [];
  const agents: WorkflowAgent[] = [];
  for (const entry of entries as ProgressEntry[]) {
    if (entry.type === "workflow_phase") {
      phases.push({ title: text(entry.title), detail: text(entry.detail) });
    } else if (entry.type === "workflow_agent") {
      agents.push({
        label: text(entry.label),
        phase: text(entry.phaseTitle),
        state: AGENT_STATES[text(entry.state)] ?? "running",
        model: text(entry.model),
        tokens: count(entry.tokens),
        toolUses: count(entry.toolCalls),
      });
    }
  }
  return { phases, agents };
}

function withUsage(task: AgentTask, usage: Usage | undefined): AgentTask {
  if (!usage) return task;
  return {
    ...task,
    tokens: count(usage.total_tokens) || task.tokens,
    toolUses: count(usage.tool_uses) || task.toolUses,
  };
}

function patch(
  tasks: readonly AgentTask[],
  id: string,
  change: (task: AgentTask) => AgentTask,
): AgentTask[] | null {
  const index = tasks.findIndex((task) => task.id === id);
  const current = tasks[index];
  if (!current) return null;
  return tasks.map((task, at) => (at === index ? change(task) : task));
}

export function applyAgentTaskEvent(
  tasks: readonly AgentTask[],
  event: Record<string, unknown>,
  now = Date.now(),
): readonly AgentTask[] {
  if (event.type !== "system") return tasks;
  const id = text(event.task_id);
  if (!id) return tasks;
  switch (event.subtype) {
    case "task_started": {
      const kind = KINDS[text(event.task_type)];
      if (!kind || tasks.some((task) => task.id === id)) return tasks;
      const description = text(event.description);
      return [
        ...tasks,
        {
          id,
          toolUseId: text(event.tool_use_id),
          kind,
          name: text(event.workflow_name) || text(event.subagent_type) || description,
          description,
          background: kind === "workflow" || event.is_backgrounded === true,
          status: "running",
          startedAt: now,
          endedAt: null,
          activity: "",
          lastTool: "",
          tokens: 0,
          toolUses: 0,
          summary: "",
          phases: [],
          agents: [],
        },
      ];
    }
    case "task_progress":
      return (
        patch(tasks, id, (task) => ({
          ...withUsage(task, event.usage as Usage | undefined),
          activity: text(event.description) || task.activity,
          lastTool: text(event.last_tool_name) || task.lastTool,
          ...workflowProgress(event.workflow_progress),
        })) ?? tasks
      );
    case "task_updated": {
      const status = ENDED[text((event.patch as { status?: unknown } | undefined)?.status)];
      if (!status) return tasks;
      return (
        patch(tasks, id, (task) =>
          task.status === "running" ? { ...task, status, endedAt: now } : task,
        ) ?? tasks
      );
    }
    case "task_notification":
      return (
        patch(tasks, id, (task) => ({
          ...withUsage(task, event.usage as Usage | undefined),
          status: ENDED[text(event.status)] ?? task.status,
          endedAt: task.endedAt ?? now,
          summary: text(event.summary) || task.summary,
          ...workflowProgress(event.workflow_progress),
        })) ?? tasks
      );
    default:
      return tasks;
  }
}

export function endAgentTasks(tasks: readonly AgentTask[], now = Date.now()): readonly AgentTask[] {
  if (!tasks.some((task) => task.status === "running")) return tasks;
  return tasks.map((task) =>
    task.status === "running" ? { ...task, status: "stopped", endedAt: now } : task,
  );
}
