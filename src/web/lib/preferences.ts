import type { InterfaceSize, MotionPreference, Preferences } from "@native/db/types";

export const DEFAULT_PREFERENCES: Preferences = {
  ide: "Cursor",
  terminalApp: "Terminal",
  quitWithAgents: "ask",
  confirmClose: true,
  interfaceSize: "default",
  codeFontSize: "12",
  reduceTransparency: false,
  motion: "system",
  notifyNeedsYou: true,
  notifyFinished: true,
  notifyErrors: true,
  notifyUsage: true,
  sound: "None",
  onlyInBackground: true,
  dockBadge: true,
  shortcuts: {},
  model: "opus-5-5",
  effort: "high",
  permissions: "manual",
  extraArgs: "",
  shell: "",
  cursor: "block",
  scrollback: "5000",
  copyOnSelect: false,
  optionAsMeta: true,
  diffView: "unified",
  spellcheck: true,
  showUsage: true,
  warnAt: "80",
  dailyAlert: "",
};

export const ZOOM: Record<InterfaceSize, number> = { compact: 0.9, default: 1, large: 1.1 };

export function motionClass(motion: MotionPreference): string | null {
  return motion === "reduce" ? "motion-reduce" : null;
}

export function parseSpendAlert(value: string): number | null {
  const amount = Number.parseFloat(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

export function mergePreferences(stored: Partial<Preferences> | null): Preferences {
  return { ...DEFAULT_PREFERENCES, ...stored, shortcuts: { ...stored?.shortcuts } };
}
