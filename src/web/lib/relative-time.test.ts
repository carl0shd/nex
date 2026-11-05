import { describe, expect, it } from "vite-plus/test";
import { relativeTime, relativeTimeLong } from "@/lib/relative-time";

const NOW = 1_800_000_000_000;

describe("relativeTime", () => {
  it.each([
    [10_000, "just now"],
    [2 * 60_000, "2m ago"],
    [3 * 3_600_000, "3h ago"],
    [30 * 3_600_000, "yesterday"],
    [5 * 86_400_000, "5d ago"],
  ])("%i ms ago → %s", (elapsed, label) => expect(relativeTime(NOW - elapsed, NOW)).toBe(label));
});

describe("relativeTimeLong", () => {
  it.each([
    [10_000, "just now"],
    [60_000, "1 minute ago"],
    [22 * 60_000, "22 minutes ago"],
    [3 * 3_600_000, "3 hours ago"],
    [5 * 86_400_000, "5 days ago"],
  ])("%i ms ago → %s", (elapsed, label) =>
    expect(relativeTimeLong(NOW - elapsed, NOW)).toBe(label),
  );
});
