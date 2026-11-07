import { describe, expect, it } from "vite-plus/test";
import { uptime } from "@/lib/uptime";

const MINUTE = 60_000;

describe("uptime", () => {
  it.each([
    [20_000, "<1m"],
    [12 * MINUTE, "12m"],
    [60 * MINUTE, "1h"],
    [65 * MINUTE, "1h 5m"],
    [26 * 60 * MINUTE, "1d 2h"],
    [-5_000, "<1m"],
  ])("formats %d ms as %s", (elapsed, label) => {
    expect(uptime(1_000_000, 1_000_000 + elapsed)).toBe(label);
  });
});
