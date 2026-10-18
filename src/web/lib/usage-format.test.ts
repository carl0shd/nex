import { describe, expect, it } from "vite-plus/test";
import { formatCompactUsd, formatTokens, formatUsd, totalTokenCount } from "@/lib/usage-format";

describe("formatUsd", () => {
  it("shows cents", () => expect(formatUsd(1.2)).toBe("$1.20"));
  it("floors tiny amounts to a hint", () => expect(formatUsd(0.004)).toBe("<$0.01"));
  it("keeps zero as zero", () => expect(formatUsd(0)).toBe("$0.00"));
});

describe("formatCompactUsd", () => {
  it("switches to thousands", () => expect(formatCompactUsd(12_400)).toBe("$12.4k"));
});

describe("formatTokens", () => {
  it.each([
    [999, "999"],
    [1_500, "1.5K"],
    [2_300_000, "2.3M"],
    [4_000_000_000, "4.0B"],
  ])("%i → %s", (count, label) => expect(formatTokens(count)).toBe(label));
});

describe("totalTokenCount", () => {
  it("adds every bucket", () =>
    expect(
      totalTokenCount({
        input: 1,
        output: 2,
        cacheWrite5m: 3,
        cacheWrite1h: 4,
        cacheRead: 5,
        webSearches: 6,
      }),
    ).toBe(15));
});
