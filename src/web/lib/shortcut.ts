const MODIFIERS: readonly [keyof ShortcutEvent, string][] = [
  ["ctrlKey", "⌃"],
  ["altKey", "⌥"],
  ["shiftKey", "⇧"],
  ["metaKey", "⌘"],
];

const NAMED: Record<string, string> = {
  " ": "Space",
  Enter: "↵",
  Escape: "esc",
  Backspace: "⌫",
  Tab: "⇥",
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
};

export interface ShortcutEvent {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
}

export function shortcutKeys(event: ShortcutEvent): string[] | null {
  if (["Meta", "Control", "Alt", "Shift"].includes(event.key)) return null;
  const modifiers = MODIFIERS.filter(([flag]) => event[flag]).map(([, symbol]) => symbol);
  if (modifiers.length === 0) return null;
  const key = NAMED[event.key] ?? (event.key.length === 1 ? event.key.toUpperCase() : event.key);
  return [...modifiers, key];
}
