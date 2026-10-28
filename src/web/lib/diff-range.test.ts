import { describe, expect, it } from "vite-plus/test";
import { rangeLabel } from "@/lib/diff-range";

describe("rangeLabel", () => {
  it("names the file and the line range, whichever way it was dragged", () => {
    expect(rangeLabel("src/auth/session.ts", { start: 49, end: 46 })).toBe("session.ts:46–49");
    expect(rangeLabel("src/auth/session.ts", { start: 12, end: 12 })).toBe("session.ts:12");
  });
});
