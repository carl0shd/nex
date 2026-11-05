export type PermissionMode = "plan" | "manual" | "dontask" | "edits" | "auto" | "bypass";

export const PERMISSION_MODES: readonly PermissionMode[] = [
  "plan",
  "manual",
  "dontask",
  "edits",
  "auto",
  "bypass",
];

export const PERMISSION_LABEL: Record<PermissionMode, string> = {
  plan: "Plan",
  manual: "Ask",
  dontask: "Don't ask",
  edits: "Accept edits",
  auto: "Auto",
  bypass: "Bypass",
};

export function stepPermissionMode(
  mode: PermissionMode,
  step: 1 | -1,
  modes: readonly PermissionMode[] = PERMISSION_MODES,
): PermissionMode {
  const count = modes.length;
  return modes[(Math.max(0, modes.indexOf(mode)) + step + count) % count] ?? mode;
}
