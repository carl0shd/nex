import { describe, expect, it } from "vite-plus/test";
import type { AccountUsage, UsageSummary } from "@native/usage/types";
import { usageStats } from "@/lib/home-stats";

const NOW = new Date("2026-11-22T12:00:00");
const TOTALS = { tokens: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, costUsd: 12.5 };

const account = (limits: Partial<AccountUsage>) =>
  ({
    isDefault: true,
    fiveHourPercent: null,
    fiveHourResetsAt: null,
    sevenDayPercent: null,
    sevenDayResetsAt: null,
    ...limits,
  }) as AccountUsage;

const summary = (accounts: AccountUsage[]) =>
  ({
    today: { total: TOTALS, inNex: TOTALS, outsideNex: TOTALS },
    trend: [
      { day: "2026-11-21", costUsd: 10, tokens: 0 },
      { day: "2026-11-22", costUsd: 12.5, tokens: 0 },
    ],
    accounts,
  }) as unknown as UsageSummary;

describe("usageStats", () => {
  it("has nothing before usage loads", () => {
    expect(usageStats(null, NOW)).toEqual({});
  });

  it("shows today's spend against the daily average", () => {
    expect(usageStats(summary([]), NOW).spend).toEqual({
      today: "$12.50",
      compared: "+25% vs your daily avg",
    });
  });

  it("reads the session limit and when it resets", () => {
    const resetsAt = new Date(NOW.getTime() + 2 * 60 * 60_000).toISOString();
    const limit = usageStats(
      summary([account({ fiveHourPercent: 42, fiveHourResetsAt: resetsAt })]),
      NOW,
    ).limit;
    expect(limit).toEqual({ label: "Session limit", percent: 42, resetsIn: "Resets in 2h" });
  });

  it("says so when no session is running", () => {
    const limit = usageStats(summary([account({ fiveHourPercent: 0 })]), NOW).limit;
    expect(limit?.resetsIn).toBe("No session running");
  });
});
