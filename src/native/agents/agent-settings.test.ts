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

  it("runs ultracode at the highest effort Claude Code has", () => {
    expect(cliFlags({ model: "opus-5-5", effort: "ultracode", mode: "bypass" })).toContain("max");
  });
});
