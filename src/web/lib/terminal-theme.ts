import type { ITheme } from "@xterm/xterm";

type ReadToken = (name: string) => string;

const withAlpha = (hex: string, alpha: number) =>
  `${hex}${Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0")}`;

export function terminalTheme(read: ReadToken): ITheme {
  const ink = read("--ink");
  const ink2 = read("--ink-2");
  const ink4 = read("--ink-4");
  return {
    background: read("--page"),
    foreground: ink2,
    cursor: ink2,
    cursorAccent: read("--page"),
    selectionBackground: withAlpha(read("--blue"), 0.28),
    black: read("--ink-6"),
    red: read("--red"),
    green: read("--green"),
    yellow: read("--orange"),
    blue: read("--blue"),
    magenta: read("--violet"),
    cyan: read("--blue"),
    white: ink2,
    brightBlack: ink4,
    brightRed: read("--red"),
    brightGreen: read("--accent-ink"),
    brightYellow: read("--orange"),
    brightBlue: read("--blue"),
    brightMagenta: read("--violet"),
    brightCyan: read("--blue"),
    brightWhite: ink,
  };
}

export function readCssToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
