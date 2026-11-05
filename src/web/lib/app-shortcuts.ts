import { expandRange, hasCommandModifier, hotkeyKey, hotkeyLabel } from "@/lib/shortcut";
import { usePreferencesStore } from "@/stores/preferences.store";

export type ShortcutId =
  | "new-task"
  | "palette"
  | "overview"
  | "next"
  | "previous"
  | "focus"
  | "tasks"
  | "views"
  | "dictate"
  | "usage"
  | "workspace"
  | "sidebar"
  | "settings";

export interface Shortcut {
  id: ShortcutId;
  label: string;
  hotkey: string;
  through?: string;
  yieldsToText?: boolean;
}

export const DEFAULT_SHORTCUTS: Shortcut[] = [
  { id: "new-task", label: "New task", hotkey: "Mod+T" },
  { id: "palette", label: "Command palette", hotkey: "Mod+K" },
  { id: "overview", label: "Overview", hotkey: "Mod+0" },
  { id: "next", label: "Next task", hotkey: "Mod+ArrowRight", yieldsToText: true },
  { id: "previous", label: "Previous task", hotkey: "Mod+ArrowLeft", yieldsToText: true },
  { id: "focus", label: "Open task in focus", hotkey: "Mod+Enter" },
  { id: "tasks", label: "Jump to task 1–9", hotkey: "Mod+1", through: "9" },
  { id: "views", label: "Agent · Changes · Notes · Shell", hotkey: "Control+1", through: "4" },
  { id: "dictate", label: "Dictate", hotkey: "Alt+Space" },
  { id: "usage", label: "Usage", hotkey: "Mod+U" },
  { id: "workspace", label: "Add workspace", hotkey: "Mod+Shift+N" },
  { id: "sidebar", label: "Show or hide the sidebar", hotkey: "Mod+S" },
  { id: "settings", label: "Settings", hotkey: "Mod+," },
];

export function defaultShortcut(id: ShortcutId): Shortcut {
  const shortcut = DEFAULT_SHORTCUTS.find((item) => item.id === id);
  if (!shortcut) throw new Error(`Unknown shortcut: ${id}`);
  return shortcut;
}

export function currentShortcut(id: ShortcutId): Shortcut {
  const shortcut = defaultShortcut(id);
  const override = usePreferencesStore.getState().prefs.shortcuts[id];
  return override ? { ...shortcut, hotkey: override } : shortcut;
}

export function rangeHotkeys(id: ShortcutId): string[] {
  const { hotkey, through } = currentShortcut(id);
  return expandRange(hotkey, through);
}

const RESERVED: Record<string, string> = {
  "Mod+Q": "Quit",
  "Mod+W": "Close window",
  "Mod+H": "Hide",
  "Mod+M": "Minimize",
  "Mod+C": "Copy",
  "Mod+V": "Paste",
  "Mod+X": "Cut",
  "Mod+A": "Select all",
  "Mod+Z": "Undo",
  "Mod+Shift+Z": "Redo",
  "Mod+F": "Find",
};

export function shortcutConflict(
  id: ShortcutId,
  hotkey: string,
  shortcuts: readonly Shortcut[],
): string | null {
  if (!hasCommandModifier(hotkey)) return "Add ⌘, ⌃ or ⌥ to the shortcut";
  const own = shortcuts.find((shortcut) => shortcut.id === id);
  const wanted = new Set(expandRange(hotkey, own?.through).map(hotkeyKey));
  const reserved = Object.entries(RESERVED).find(([key]) => wanted.has(hotkeyKey(key)));
  if (reserved) return `Used by macOS for ${reserved[1]}`;
  const taken = shortcuts.find(
    (shortcut) =>
      shortcut.id !== id &&
      expandRange(shortcut.hotkey, shortcut.through).some((key) => wanted.has(hotkeyKey(key))),
  );
  return taken ? `Already used by ${taken.label}` : null;
}

export function shortcutLabel(id: ShortcutId): string {
  return hotkeyLabel(currentShortcut(id).hotkey);
}
