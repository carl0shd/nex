import { describe, expect, it } from "vite-plus/test";
import { limitWarning } from "@/lib/limit-warning";

const now = new Date("2026-11-04T15:00:00");
const inTwoHours = new Date("2026-11-04T17:00:00").toISOString();
const account = (fiveHourPercent: number | null) => ({
  accountId: "a1",
  fiveHourPercent,
  fiveHourResetsAt: inTwoHours,
  sevenDayPercent: 40,
  sevenDayResetsAt: inTwoHours,
});

describe("limitWarning", () => {
  it("stays quiet under the first threshold", () => {
    expect(limitWarning(account(60), now)).toBeNull();
  });

  it("warns once per threshold and window", () => {
    const first = limitWarning(account(86), now);
    const second = limitWarning(account(97), now);
    expect(first).toMatchObject({ threshold: 80, title: "Session limit at 86%" });
    expect(first?.body).toMatch(/^At this pace you hit the limit in ~.+\. It resets at /);
    expect(second?.threshold).toBe(95);
    expect(second?.key).not.toBe(first?.key);
    expect(limitWarning(account(88), now)?.key).toBe(first?.key);
  });

  it("uses the weekly window when there is no session limit", () => {
    const weekly = { ...account(null), sevenDayPercent: 90 };
    expect(limitWarning(weekly, now)?.title).toBe("Weekly limit at 90%");
  });
});
