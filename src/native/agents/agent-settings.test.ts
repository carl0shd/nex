import { describe, expect, it } from "vite-plus/test";
import { cliFlags } from "@native/agents/agent-settings";

describe("cliFlags", () => {
  it("turns composer choices into Claude Code flags", () => {
    expect(cliFlags({ model: "sonnet-5", effort: "xhigh", mode: "edits" })).toEqual([
      "--model",
      "sonnet",
      "--effort",
      "xhigh",
      "--permission-mode",
      "acceptEdits",
    ]);
  });

  it("runs ultracode at the highest effort with Claude Code's ultracode mode on", () => {
    const flags = cliFlags({ model: "opus-5-5", effort: "ultracode", mode: "bypass" });
    expect(flags).toContain("max");
    expect(flags.slice(-2)).toEqual(["--settings", '{"ultracode":true}']);
  });

  it("leaves ultracode off below it", () => {
    expect(cliFlags({ model: "opus-5-5", effort: "max", mode: "bypass" })).not.toContain(
      "--settings",
    );
  });
});
