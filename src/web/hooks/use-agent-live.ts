import { useSyncExternalStore } from "react";
import { EMPTY_LIVE, applyLiveEvent, type LiveState } from "@/lib/agent-live";

const states = new Map<string, LiveState>();
const listeners = new Set<() => void>();
let listening = false;

function setLive(sessionId: string, next: LiveState) {
  states.set(sessionId, next);
  for (const listener of listeners) listener();
}

export function clearAgentExit(sessionId: string): void {
  const current = states.get(sessionId);
  if (current?.exit) setLive(sessionId, { ...current, exit: null });
}

function listen() {
  if (listening) return;
  listening = true;
  window.api.onAgentEvent(({ sessionId, event }) => {
    const current = states.get(sessionId) ?? EMPTY_LIVE;
    const next = applyLiveEvent(current, event);
    if (next !== current) setLive(sessionId, next);
  });
}

function subscribe(listener: () => void) {
  listen();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAgentLive(sessionId: string): LiveState {
  return useSyncExternalStore(subscribe, () => states.get(sessionId) ?? EMPTY_LIVE);
}
