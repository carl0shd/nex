import { parseHotkey } from "@tanstack/react-hotkeys";

const MODIFIERS = [
  ["ctrl", "⌃"],
  ["alt", "⌥"],
  ["shift", "⇧"],
  ["meta", "⌘"],
] as const;

const NAMED: Record<string, string> = {
  " ": "Space",
  Space: "Space",
  Enter: "↵",
  Escape: "esc",
  Backspace: "⌫",
  Tab: "⇥",
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
};

export function hotkeyCaps(hotkey: string): string[] {
  const parsed = parseHotkey(hotkey, "mac");
  const modifiers = MODIFIERS.filter(([flag]) => parsed[flag]).map(([, symbol]) => symbol);
  const key =
    NAMED[parsed.key] ?? (parsed.key.length === 1 ? parsed.key.toUpperCase() : parsed.key);
  return [...modifiers, key];
}

export function hotkeyLabel(hotkey: string): string {
  return hotkeyCaps(hotkey).join("");
}

const HELD_MODIFIERS: Record<string, string> = {
  Control: "⌃",
  Alt: "⌥",
  Shift: "⇧",
  Meta: "⌘",
};

export function heldKeysLabel(keys: readonly string[]): string {
  const modifiers = MODIFIERS.map(([, symbol]) => symbol).filter((symbol) =>
    keys.some((key) => HELD_MODIFIERS[key] === symbol),
  );
  const rest = keys
    .filter((key) => !HELD_MODIFIERS[key])
    .map((key) => NAMED[key] ?? (key.length === 1 ? key.toUpperCase() : key));
  return [...modifiers, ...rest].join("");
}

export function hotkeyKey(hotkey: string): string {
  const parsed = parseHotkey(hotkey, "mac");
  const flags = MODIFIERS.filter(([flag]) => parsed[flag]).map(([flag]) => flag);
  return [...flags, parsed.key.toLowerCase()].join("+");
}

export function hasCommandModifier(hotkey: string): boolean {
  const parsed = parseHotkey(hotkey, "mac");
  return parsed.meta || parsed.ctrl || parsed.alt;
}

export function expandRange(hotkey: string, through?: string): string[] {
  const match = hotkey.match(/^(.*?)(\d)$/);
  if (!match || !through) return [hotkey];
  const [, prefix, first] = match;
  return Array.from(
    { length: Number(through) - Number(first) + 1 },
    (_, index) => `${prefix}${Number(first) + index}`,
  );
}
