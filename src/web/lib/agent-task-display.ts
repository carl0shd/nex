import type { AgentTask } from "@native/agents/agent-tasks";
import type { WorkflowCardPhase } from "@/components/task/block-cards";
import { formatDuration } from "@/lib/tool-display";
import { compactTokens } from "@/lib/usage";

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

export function agentTaskMeta(task: AgentTask, now: number): string {
  const elapsed = (task.endedAt ?? now) - task.startedAt;
  return [
    task.background && task.kind === "agent" && "in background",
    task.toolUses > 0 && plural(task.toolUses, "tool"),
    task.tokens > 0 && `${compactTokens(task.tokens)} tokens`,
    elapsed >= 1000 && formatDuration(elapsed),
  ]
    .filter(Boolean)
    .join(" · ");
}

export function workflowMeta(task: AgentTask, now: number): string {
  const total = task.agents.length;
  const done = task.agents.filter((agent) => agent.state === "done").length;
  const elapsed = (task.endedAt ?? now) - task.startedAt;
  return [
    total > 0 &&
      (task.status === "running" ? `${done} of ${total} agents` : plural(total, "agent")),
    task.tokens > 0 && `${compactTokens(task.tokens)} tokens`,
    elapsed >= 1000 && formatDuration(elapsed),
    task.status === "stopped" && "stopped",
    task.status === "failed" && "failed",
  ]
    .filter(Boolean)
    .join(" · ");
}

export function workflowPhases(task: AgentTask): WorkflowCardPhase[] {
  const titles = [
    ...task.phases.map((phase) => phase.title),
    ...task.agents.map((agent) => agent.phase),
  ].filter((title, index, all) => all.indexOf(title) === index);
  return titles
    .map((title) => ({
      title,
      agents: task.agents
        .filter((agent) => agent.phase === title)
        .map((agent) => ({
          label: agent.label,
          state: agent.state,
          meta: agent.tokens > 0 ? `${compactTokens(agent.tokens)} tokens` : "",
        })),
    }))
    .filter((phase) => phase.agents.length > 0);
}
