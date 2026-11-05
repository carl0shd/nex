import { describe, expect, it } from "vite-plus/test";
import { hasNexHooks, removeNexHooks } from "@native/hooks/settings";

const settings = {
  theme: "dark",
  hooks: {
    PreToolUse: [
      { matcher: "Bash", hooks: [{ type: "command", command: "lint.sh" }] },
      { matcher: "*", hooks: [{ type: "command", command: "curl … # nex-hook" }] },
    ],
    Stop: [{ hooks: [{ type: "command", command: "curl … # nex-hook" }] }],
  },
};

describe("old Nex hooks", () => {
  it("are found in settings", () => {
    expect(hasNexHooks(settings)).toBe(true);
    expect(hasNexHooks({ theme: "dark" })).toBe(false);
  });

  it("are removed without touching anything else", () => {
    const cleaned = removeNexHooks(settings);
    expect(cleaned.theme).toBe("dark");
    expect(cleaned.hooks).toEqual({
      PreToolUse: [{ matcher: "Bash", hooks: [{ type: "command", command: "lint.sh" }] }],
    });
    expect(hasNexHooks(cleaned)).toBe(false);
  });

  it("drops the hooks key when only Nex hooks were there", () => {
    expect(removeNexHooks({ hooks: settings.hooks }).hooks?.Stop).toBeUndefined();
    expect(removeNexHooks({ hooks: { Stop: settings.hooks.Stop } })).toEqual({});
  });
});
