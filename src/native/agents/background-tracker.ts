import { BrowserWindow } from "electron";
import {
  NO_BACKGROUND,
  applyBackgroundEvent,
  type BackgroundCommand,
  type BackgroundState,
} from "@native/agents/background-commands";
import { IPC } from "@native/ipc/channels";

const states = new Map<string, BackgroundState>();

function publish(sessionId: string, commands: BackgroundCommand[]) {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(IPC.AGENT_BACKGROUND, { sessionId, commands });
  }
}

export function trackBackground(sessionId: string, event: Record<string, unknown>): void {
  const current = states.get(sessionId) ?? NO_BACKGROUND;
  const next = applyBackgroundEvent(current, event);
  if (next === current) return;
  states.set(sessionId, next);
  if (next.commands !== current.commands) publish(sessionId, next.commands);
}

export function clearBackground(sessionId: string): void {
  const current = states.get(sessionId);
  states.delete(sessionId);
  if (current?.commands.length) publish(sessionId, []);
}

export function backgroundCommands(): Record<string, BackgroundCommand[]> {
  return Object.fromEntries(
    [...states]
      .filter(([, state]) => state.commands.length > 0)
      .map(([sessionId, state]) => [sessionId, state.commands]),
  );
}
