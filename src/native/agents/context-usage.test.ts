import { describe, expect, it } from "vite-plus/test";
import { toContextUsage } from "@native/agents/context-usage";

describe("toContextUsage", () => {
  it("groups what Claude reports into the parts Nex shows", () => {
    const usage = toContextUsage({
      categories: [
        { name: "System prompt", tokens: 6000, kind: "used" },
        { name: "System tools", tokens: 9000, kind: "used" },
        { name: "MCP tools (deferred)", tokens: 3000, kind: "deferred", isDeferred: true },
        { name: "Skills", tokens: 2000, kind: "used" },
        { name: "Messages", tokens: 81000, kind: "used" },
        { name: "Free space", tokens: 900000, kind: "free" },
      ],
      totalTokens: 98000,
      maxTokens: 1_000_000,
    });
    expect(usage).toEqual({
      used: 98000,
      max: 1_000_000,
      percent: 10,
      parts: [
        { id: "conversation", tokens: 81000 },
        { id: "tools", tokens: 9000 },
        { id: "system", tokens: 6000 },
        { id: "extras", tokens: 2000 },
      ],
    });
  });
});
