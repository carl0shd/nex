import { describe, expect, it } from "vite-plus/test";
import { terminalTheme } from "@/lib/terminal-theme";

const TOKENS: Record<string, string> = {
  "--page": "#131412",
  "--ink": "#ecebe6",
  "--ink-2": "#b9b8b2",
  "--ink-4": "#6f716c",
  "--ink-6": "#3a3b38",
  "--blue": "#6f9ae0",
  "--green": "#4a9e57",
  "--accent-ink": "#7cc488",
  "--orange": "#d89c32",
  "--red": "#e0664f",
  "--violet": "#8a6fe0",
};

describe("terminalTheme", () => {
  const theme = terminalTheme((name) => TOKENS[name]);

  it("paints the terminal with the page and body ink", () => {
    expect(theme).toMatchObject({ background: "#131412", foreground: "#b9b8b2" });
  });

  it("maps the prompt green and dim text to the palette", () => {
    expect(theme).toMatchObject({ brightGreen: "#7cc488", brightBlack: "#6f716c" });
  });

  it("tints the selection with translucent blue", () => {
    expect(theme.selectionBackground).toBe("#6f9ae047");
  });
});
