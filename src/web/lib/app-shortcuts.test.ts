import { describe, expect, it } from "vite-plus/test";
import { DEFAULT_SHORTCUTS, shortcutConflict } from "@/lib/app-shortcuts";

describe("shortcutConflict", () => {
  it("names the shortcut that already uses the keys", () => {
    expect(shortcutConflict("new-task", "Mod+K", DEFAULT_SHORTCUTS)).toBe(
      "Already used by Command palette",
    );
  });

  it("checks every key of a range", () => {
    expect(shortcutConflict("palette", "Mod+3", DEFAULT_SHORTCUTS)).toBe(
      "Already used by Jump to task 1–9",
    );
  });

  it("keeps macOS shortcuts and plain keys free", () => {
    expect(shortcutConflict("palette", "Mod+C", DEFAULT_SHORTCUTS)).toBe("Used by macOS for Copy");
    expect(shortcutConflict("palette", "K", DEFAULT_SHORTCUTS)).toBe(
      "Add ⌘, ⌃ or ⌥ to the shortcut",
    );
  });

  it("allows a free combination and the shortcut's own keys", () => {
    expect(shortcutConflict("palette", "Mod+Shift+P", DEFAULT_SHORTCUTS)).toBeNull();
    expect(shortcutConflict("palette", "Mod+K", DEFAULT_SHORTCUTS)).toBeNull();
  });
});
