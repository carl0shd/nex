import { describe, expect, it } from "vite-plus/test";
import { claudeCompat, compareVersions } from "@/lib/claude-version";

describe("claude version", () => {
  it("compares numerically, not as text", () => {
    expect(compareVersions("2.1.280", "2.1.30")).toBe(1);
    expect(compareVersions("2.0.9", "2.1.0")).toBe(-1);
    expect(compareVersions("2.1.0", "2.1.0")).toBe(0);
  });

  it("tells outdated, tested and newer versions apart", () => {
    expect(claudeCompat("2.0.99")).toBe("outdated");
    expect(claudeCompat("2.1.280")).toBe("ok");
    expect(claudeCompat("2.2.0")).toBe("newer");
  });
});
