import { randomUUID } from "crypto";
import { BrowserWindow } from "electron";
import { IPC } from "@native/ipc/channels";

export interface PermissionRequest {
  id: string;
  sessionId: string;
  tool: string;
  input: Record<string, unknown>;
  canRemember: boolean;
  at: string;
}

export type PermissionAnswer =
  | { behavior: "allow"; remember?: boolean; updatedInput?: Record<string, unknown> }
  | { behavior: "deny"; message?: string };

interface PermissionAsk {
  sessionId: string;
  tool: string;
  input: Record<string, unknown>;
  suggestions: unknown[];
}

const pending = new Map<
  string,
  { request: PermissionRequest; resolve: (answer: PermissionAnswer) => void }
>();

function broadcast(channel: string, payload: unknown) {
  for (const window of BrowserWindow.getAllWindows()) window.webContents.send(channel, payload);
}

export function requestPermission(ask: PermissionAsk): Promise<PermissionAnswer> {
  const request: PermissionRequest = {
    id: randomUUID(),
    sessionId: ask.sessionId,
    tool: ask.tool,
    input: ask.input,
    canRemember: ask.suggestions.length > 0,
    at: new Date().toISOString(),
  };
  return new Promise((resolve) => {
    pending.set(request.id, { request, resolve });
    broadcast(IPC.PERMISSION_REQUEST, request);
  });
}

export function answerPermission(id: string, answer: PermissionAnswer): void {
  const entry = pending.get(id);
  if (!entry) return;
  pending.delete(id);
  entry.resolve(answer);
  broadcast(IPC.PERMISSION_RESOLVED, id);
}

export function dropPermissionsFor(sessionId: string): void {
  for (const [id, entry] of pending) {
    if (entry.request.sessionId !== sessionId) continue;
    pending.delete(id);
    entry.resolve({ behavior: "deny" });
    broadcast(IPC.PERMISSION_RESOLVED, id);
  }
}

export function pendingPermissions(): PermissionRequest[] {
  return [...pending.values()].map((entry) => entry.request);
}
