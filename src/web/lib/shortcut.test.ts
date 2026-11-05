import { describe, expect, it } from "vite-plus/test";
import { expandRange, heldKeysLabel, hotkeyCaps, hotkeyLabel } from "@/lib/shortcut";

describe("hotkeyCaps", () => {
  it("orders modifiers the macOS way and uppercases letters", () => {
    expect(hotkeyCaps("Mod+Shift+N")).toEqual(["⇧", "⌘", "N"]);
    expect(hotkeyCaps("Control+Alt+K")).toEqual(["⌃", "⌥", "K"]);
  });

  it("names special keys", () => {
    expect(hotkeyCaps("Alt+Space")).toEqual(["⌥", "Space"]);
    expect(hotkeyCaps("Mod+Enter")).toEqual(["⌘", "↵"]);
  });

  it("joins the caps for inline hints", () => {
    expect(hotkeyLabel("Mod+\\")).toBe("⌘\\");
  });
});

describe("heldKeysLabel", () => {
  it("orders modifiers the Mac way and appends the key", () => {
    expect(heldKeysLabel(["Meta", "Shift", "k"])).toBe("⇧⌘K");
    expect(heldKeysLabel(["Alt", " "])).toBe("⌥Space");
    expect(heldKeysLabel([])).toBe("");
  });
});

describe("expandRange", () => {
  it("expands a numbered shortcut through its last digit", () => {
    expect(expandRange("Mod+1", "3")).toEqual(["Mod+1", "Mod+2", "Mod+3"]);
    expect(expandRange("Mod+K")).toEqual(["Mod+K"]);
  });
});
