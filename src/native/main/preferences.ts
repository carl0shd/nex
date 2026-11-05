import { execFile } from "child_process";
import { existsSync, readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import * as settingsRepo from "@native/db/repositories/settings.repo";
import type { Preferences } from "@native/db/types";

export const PREFERENCES_KEY = "preferences";
export const NOTIFICATION_SOUNDS = ["Glass", "Pop", "Tink", "Purr", "Ping"] as const;

export function readPreferences(): Partial<Preferences> {
  try {
    return settingsRepo.get<Partial<Preferences>>(PREFERENCES_KEY, {});
  } catch {
    return {};
  }
}

export function extraAgentArgs(): string[] {
  return (readPreferences().extraArgs ?? "").trim().split(/\s+/).filter(Boolean);
}

export function preferredShell(): string | null {
  const shell = readPreferences().shell;
  return shell && listShells().includes(shell) ? shell : null;
}

export function listShells(): string[] {
  try {
    return readFileSync("/etc/shells", "utf8")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("/"));
  } catch {
    return [];
  }
}

export function playSound(name: string): void {
  if (!(NOTIFICATION_SOUNDS as readonly string[]).includes(name)) return;
  execFile("afplay", [`/System/Library/Sounds/${name}.aiff`], () => {});
}

export function openWith(appName: string, path: string): Promise<boolean> {
  return new Promise((resolve) => {
    execFile("open", ["-a", appName, path], (error) => resolve(!error));
  });
}

const APP_DIRS = [
  "/Applications",
  join(homedir(), "Applications"),
  "/System/Applications",
  "/System/Applications/Utilities",
];

export function installedApps(names: readonly string[]): string[] {
  return names.filter((name) => APP_DIRS.some((dir) => existsSync(join(dir, `${name}.app`))));
}
