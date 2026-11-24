import { useSyncExternalStore } from "react";
import type { AgentTask } from "@native/agents/agent-tasks";

const NONE: readonly AgentTask[] = [];
const bySession = new Map<string, readonly AgentTask[]>();
const listeners = new Set<() => void>();
let listening = false;

function update(sessionId: string, tasks: readonly AgentTask[]) {
  bySession.set(sessionId, tasks);
  for (const listener of listeners) listener();
}

function listen() {
  if (listening) return;
  listening = true;
  const touched = new Set<string>();
  window.api.onAgentTasks(({ sessionId, tasks }) => {
    touched.add(sessionId);
    update(sessionId, tasks);
  });
  void window.api.getAgentTasks().then((fetched) => {
    for (const [sessionId, tasks] of Object.entries(fetched)) {
      if (!touched.has(sessionId)) update(sessionId, tasks);
    }
  });
}

function subscribe(listener: () => void) {
  listen();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAgentTasks(sessionId: string): readonly AgentTask[] {
  return useSyncExternalStore(subscribe, () => bySession.get(sessionId) ?? NONE);
}
