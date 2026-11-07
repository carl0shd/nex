import { useSyncExternalStore } from "react";
import type { TerminalRuntime } from "@native/pty/manager";

let runtimes: Record<string, TerminalRuntime> = {};
const listeners = new Set<() => void>();
let listening = false;

function update(next: Record<string, TerminalRuntime>) {
  runtimes = next;
  for (const listener of listeners) listener();
}

function listen() {
  if (listening) return;
  listening = true;
  const touched = new Set<string>();
  window.api.onTerminalRuntime(({ id, runtime }) => {
    touched.add(id);
    const { [id]: _gone, ...rest } = runtimes;
    update(runtime ? { ...rest, [id]: runtime } : rest);
  });
  void window.api.getTerminalRuntimes().then((fetched) => {
    const untouched = Object.entries(fetched).filter(([id]) => !touched.has(id));
    if (untouched.length) update({ ...Object.fromEntries(untouched), ...runtimes });
  });
}

function subscribe(listener: () => void) {
  listen();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTerminalRuntimes(): Record<string, TerminalRuntime> {
  return useSyncExternalStore(subscribe, () => runtimes);
}
