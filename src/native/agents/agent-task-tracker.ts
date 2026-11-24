import { BrowserWindow } from "electron";
import { applyAgentTaskEvent, endAgentTasks, type AgentTask } from "@native/agents/agent-tasks";
import { IPC } from "@native/ipc/channels";

const tasksBySession = new Map<string, readonly AgentTask[]>();

function publish(sessionId: string, tasks: readonly AgentTask[]) {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(IPC.AGENT_TASKS, { sessionId, tasks });
  }
}

export function trackAgentTasks(sessionId: string, event: Record<string, unknown>): void {
  const current = tasksBySession.get(sessionId) ?? [];
  const next = applyAgentTaskEvent(current, event);
  if (next === current) return;
  tasksBySession.set(sessionId, next);
  publish(sessionId, next);
}

export function endTrackedAgentTasks(sessionId: string): void {
  const current = tasksBySession.get(sessionId);
  if (!current) return;
  const next = endAgentTasks(current);
  if (next === current) return;
  tasksBySession.set(sessionId, next);
  publish(sessionId, next);
}

export function agentTasks(): Record<string, readonly AgentTask[]> {
  return Object.fromEntries(tasksBySession);
}
