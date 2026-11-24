import { describe, expect, it } from "vite-plus/test";
import { claudeSessionTitle } from "@native/agents/claude-session-title";

const line = (entry: Record<string, unknown>) => JSON.stringify(entry);

describe("claudeSessionTitle", () => {
  it("uses the first line of the first real prompt", () => {
    expect(
      claudeSessionTitle([
        line({ type: "summary" }),
        line({ type: "user", isMeta: true, message: { content: "Caveat" } }),
        line({ type: "user", message: { content: "<command-name>/clear</command-name>" } }),
        line({
          type: "user",
          message: { content: [{ type: "text", text: "Fix the login\nmore" }] },
        }),
      ]),
    ).toBe("Fix the login");
  });

  it("has no title when nobody wrote anything", () => {
    expect(claudeSessionTitle(["not json", line({ type: "assistant" })])).toBeNull();
  });
});
