export const MIN_CLAUDE_VERSION = "2.1.0";
export const TESTED_CLAUDE_VERSION = "2.1.280";

export type ClaudeCompat = "ok" | "outdated" | "newer";

export function compareVersions(a: string, b: string): number {
  const left = a.split(".").map(Number);
  const right = b.split(".").map(Number);
  for (let index = 0; index < 3; index++) {
    const diff = (left[index] ?? 0) - (right[index] ?? 0);
    if (diff !== 0) return Math.sign(diff);
  }
  return 0;
}

export function claudeCompat(version: string): ClaudeCompat {
  if (compareVersions(version, MIN_CLAUDE_VERSION) < 0) return "outdated";
  if (compareVersions(version, TESTED_CLAUDE_VERSION) > 0) return "newer";
  return "ok";
}
