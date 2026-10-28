import { describe, expect, it } from "vite-plus/test";
import { shortcutKeys } from "@/lib/shortcut";

const press = (
  key: string,
  mods: Partial<Record<"metaKey" | "ctrlKey" | "altKey" | "shiftKey", boolean>> = {},
) => ({
  key,
  metaKey: false,
  ctrlKey: false,
  altKey: false,
  shiftKey: false,
  ...mods,
});

describe("shortcutKeys", () => {
  it("orders modifiers the macOS way and uppercases letters", () => {
    expect(shortcutKeys(press("k", { metaKey: true, shiftKey: true }))).toEqual(["⇧", "⌘", "K"]);
  });

  it("names special keys", () => {
    expect(shortcutKeys(press(" ", { altKey: true }))).toEqual(["⌥", "Space"]);
    expect(shortcutKeys(press("Enter", { metaKey: true }))).toEqual(["⌘", "↵"]);
  });

  it("waits while only modifiers are held and rejects bare keys", () => {
    expect(shortcutKeys(press("Meta", { metaKey: true }))).toBeNull();
    expect(shortcutKeys(press("k"))).toBeNull();
  });
});
