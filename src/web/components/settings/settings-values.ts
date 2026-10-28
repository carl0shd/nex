import type { Shortcut } from "@/components/settings/shortcut-row";

const options = <T extends string>(values: readonly T[], labels?: Partial<Record<T, string>>) =>
  values.map((value) => ({ value, label: labels?.[value] ?? value }));

export const IDES = options(["Cursor", "VS Code", "Zed", "Xcode"]);
export const TERMINALS = options(["Ghostty", "Terminal", "iTerm", "Warp"]);
export const CODE_FONTS = options(["JetBrains Mono", "SF Mono", "Berkeley Mono", "Fira Code"]);
export const FONT_SIZES = options(["11", "12", "13", "14"]);
export const MOTION = options(["system", "reduce", "full"], {
  system: "Follow system",
  reduce: "Reduce",
  full: "Full motion",
});
export const SOUNDS = options(["Soft chime", "Glass", "Pop", "None"]);
export const HISTORY = options(["7", "30", "90", "forever"], {
  "7": "7 days",
  "30": "30 days",
  "90": "90 days",
  forever: "Forever",
});
export const MODEL_OPTIONS = options(["Fable 5.1", "Opus 5.5", "Sonnet 5", "Haiku 4.5"]);
export const EFFORTS = options(["Low", "Medium", "High", "X-high", "Max"]);
export const PERMISSIONS = options(["Plan", "Ask first", "Accept edits", "Auto", "Bypass"]);
export const MEMORY = options(["4", "8", "12", "16"], {
  "4": "4 GB",
  "8": "8 GB",
  "12": "12 GB",
  "16": "16 GB",
});
export const RUN_AT_MOST = options(["2", "3", "4", "6"], {
  "2": "2 environments",
  "3": "3 environments",
  "4": "4 environments",
  "6": "6 environments",
});
export const PAUSE_AFTER = options(["5", "15", "30", "never"], {
  "5": "5 min",
  "15": "15 min",
  "30": "30 min",
  never: "Never",
});
export const SHELLS = options(["zsh", "bash", "fish"]);
export const SCROLLBACK = options(["1,000", "5,000", "10,000", "50,000"]);
export const COMPARE = options(["base", "uncommitted"], {
  base: "Base branch",
  uncommitted: "Uncommitted only",
});
export const COLLAPSE = options(["200", "400", "1000", "never"], {
  "200": "Over 200 lines",
  "400": "Over 400 lines",
  "1000": "Over 1,000 lines",
  never: "Never",
});
export const NOTE_TEMPLATES = options(["empty", "task", "checklist"], {
  empty: "Empty page",
  task: "Task brief",
  checklist: "Checklist",
});
export const MICROPHONES = options(["MacBook Pro Microphone", "AirPods Pro", "Studio Display"]);
export const LANGUAGES = options(["Español", "English", "Português"]);
export const WARN_AT = options(["70", "80", "90"], { "70": "70%", "80": "80%", "90": "90%" });

export const DEFAULT_SHORTCUTS: Shortcut[] = [
  { id: "new-task", label: "New task", keys: ["⌘", "T"] },
  { id: "palette", label: "Command palette", keys: ["⌘", "K"] },
  { id: "overview", label: "Overview", keys: ["⌘", "0"] },
  { id: "next", label: "Next agent", keys: ["⌘", "]"] },
  { id: "previous", label: "Previous agent", keys: ["⌘", "["] },
  { id: "focus", label: "Open task in focus", keys: ["⌘", "↵"] },
  { id: "views", label: "Agent · Changes · Notes · Shell", keys: ["⌘", "1"], through: "4" },
  { id: "dictate", label: "Dictate", keys: ["⌥", "Space"] },
  { id: "usage", label: "Usage", keys: ["⌘", "U"] },
  { id: "workspace", label: "Add workspace", keys: ["⌘", "⇧", "N"] },
  { id: "settings", label: "Settings", keys: ["⌘", ","] },
];

export const DEFAULT_SETTINGS = {
  openAtLogin: false,
  ide: "Cursor",
  terminal: "Ghostty",
  quitWithAgents: "ask" as "ask" | "quit",
  confirmClose: true,
  theme: "dark" as "system" | "dark" | "light",
  interfaceSize: "default" as "compact" | "default" | "large",
  codeFont: "JetBrains Mono",
  codeFontSize: "12",
  reduceTransparency: false,
  motion: "system",
  showSidebar: true,
  notifyNeedsYou: true,
  notifyFinished: true,
  notifyErrors: true,
  notifyUsage: true,
  sound: "Soft chime",
  onlyInBackground: true,
  dockBadge: true,
  shortcuts: DEFAULT_SHORTCUTS,
  defaultAccount: "monoku",
  model: "Opus 5.5",
  effort: "High",
  permissions: "Ask first",
  resumeSession: true,
  history: "30",
  branchPrefix: "feat/",
  copyIntoWorktrees: ".env, .env.local",
  runSetup: true,
  onClose: "ask" as "ask" | "keep" | "remove",
  deleteBranch: false,
  memory: "8",
  runAtMost: "3",
  pauseAfter: "15",
  startOnCreate: true,
  shell: "zsh",
  cursor: "block" as "block" | "bar" | "underline",
  scrollback: "10,000",
  copyOnSelect: false,
  optionAsMeta: true,
  stopCommands: true,
  diffView: "unified" as "unified" | "split",
  compare: "base",
  wordDiff: true,
  ignoreWhitespace: false,
  fileTree: true,
  collapse: "400",
  noteTemplate: "empty",
  markdownShortcuts: true,
  spellcheck: true,
  microphone: "MacBook Pro Microphone",
  language: "Español",
  showUsage: true,
  warnAt: "80",
  dailyAlert: "$20.00",
  channel: "stable" as "stable" | "beta",
  autoUpdate: true,
};

export type SettingsValues = typeof DEFAULT_SETTINGS;
