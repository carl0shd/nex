import { useSyncExternalStore } from "react";
import type { BackgroundCommand } from "@native/agents/background-commands";

const NONE: BackgroundCommand[] = [];
const bySession = new Map<string, BackgroundCommand[]>();
const listeners = new Set<() => void>();
let listening = false;

function update(sessionId: string, commands: BackgroundCommand[]) {
  if (commands.length) bySession.set(sessionId, commands);
  else bySession.delete(sessionId);
  for (const listener of listeners) listener();
}

function listen() {
  if (listening) return;
  listening = true;
  const touched = new Set<string>();
  window.api.onBackgroundCommands(({ sessionId, commands }) => {
    touched.add(sessionId);
    update(sessionId, commands);
  });
  void window.api.getBackgroundCommands().then((fetched) => {
    for (const [sessionId, commands] of Object.entries(fetched)) {
      if (!touched.has(sessionId)) update(sessionId, commands);
    }
  });
}

function subscribe(listener: () => void) {
  listen();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useBackgroundCommands(sessionId: string): BackgroundCommand[] {
  return useSyncExternalStore(subscribe, () => bySession.get(sessionId) ?? NONE);
}
