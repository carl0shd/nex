import { describe, expect, it } from "vite-plus/test";
import { matchScore, searchItems, stepIndex } from "@/lib/command-search";

describe("matchScore", () => {
  it("ranks a prefix over a word start over a match inside a word", () => {
    const prefix = matchScore("login.tsx", "log");
    const wordStart = matchScore("src/routes/login.tsx", "log");
    const inside = matchScore("dialog", "log");
    expect(prefix).toBeGreaterThan(wordStart ?? 0);
    expect(wordStart).toBeGreaterThan(inside ?? 0);
  });

  it("falls back to letters in order and rejects anything else", () => {
    expect(matchScore("fix-login-redirect", "flr")).toBeGreaterThan(0);
    expect(matchScore("fix-login-redirect", "xyz")).toBeNull();
  });
});

describe("searchItems", () => {
  const items = [
    { label: "Toggle light / dark", keywords: ["theme"] },
    { label: "New task" },
    { label: "Open in IDE" },
  ];

  it("keeps the original order without a query", () => {
    expect(searchItems(items, "  ")).toEqual(items);
  });

  it("matches keywords and drops what does not match", () => {
    expect(searchItems(items, "theme").map((item) => item.label)).toEqual(["Toggle light / dark"]);
  });

  it("puts the best match first", () => {
    expect(searchItems(items, "ta").map((item) => item.label)).toEqual([
      "New task",
      "Toggle light / dark",
    ]);
  });
});

describe("stepIndex", () => {
  it("wraps around both ends", () => {
    expect(stepIndex(0, -1, 3)).toBe(2);
    expect(stepIndex(2, 1, 3)).toBe(0);
    expect(stepIndex(0, 1, 0)).toBe(0);
  });
});
