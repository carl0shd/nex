import { describe, expect, it } from "vite-plus/test";
import {
  SESSION_WINDOW_MS,
  comparedToAverage,
  compactTokens,
  formatDuration,
  formatTokens,
  sessionForecast,
  WEEK_WINDOW_MS,
  sparkline,
  usageTone,
} from "@/lib/usage";

describe("usageTone", () => {
  it("turns orange at 60% and red at 85%", () => {
    expect(usageTone(59)).toBe("green");
    expect(usageTone(60)).toBe("orange");
    expect(usageTone(84)).toBe("orange");
    expect(usageTone(85)).toBe("red");
  });
});

describe("sparkline", () => {
  it("spreads the points across the width with the peak at the top", () => {
    const line = sparkline([0, 10, 5]);
    expect(line.points).toBe("0.00,26.00 50.00,2.00 100.00,14.00");
  });

  it("places the average of the earlier days and the last day", () => {
    const line = sparkline([10, 0, 5]);
    expect(line.averageTop).toBe(50);
    expect(line.lastTop).toBe(50);
  });

  it("keeps a flat line on the floor when every day is zero", () => {
    expect(sparkline([0, 0]).points).toBe("0.00,26.00 100.00,26.00");
  });
});

const now = new Date("2026-11-02T12:00:00");

describe("sessionForecast", () => {
  it("projects the end of the window from the pace so far", () => {
    const resetsAt = new Date(now.getTime() + SESSION_WINDOW_MS / 2);
    const forecast = sessionForecast(40, resetsAt, now);
    expect(forecast.projected).toBe(80);
    expect(forecast.forecast).toBe("At this pace you end the window around 80%");
    expect(forecast.resetsIn).toBe("2h 30m");
  });

  it("says when the limit is reached at the current pace", () => {
    const resetsAt = new Date(now.getTime() + SESSION_WINDOW_MS / 2);
    const forecast = sessionForecast(80, resetsAt, now);
    expect(forecast.projected).toBe(100);
    expect(forecast.forecast).toBe("At this pace you hit the limit in ~38 min");
  });

  it("measures the weekly window in days", () => {
    const resetsAt = new Date(now.getTime() + WEEK_WINDOW_MS / 2);
    const forecast = sessionForecast(33, resetsAt, now, "weekly");
    expect(forecast.window).toBe("weekly");
    expect(forecast.resetsIn).toBe("3d 12h");
    expect(forecast.projected).toBe(66);
  });

  it("handles no running window", () => {
    expect(sessionForecast(null, null, now).forecast).toBe("No session running right now");
  });
});

describe("formatting", () => {
  it("formats durations and tokens", () => {
    expect(formatDuration(32 * 60_000)).toBe("32 min");
    expect(formatDuration(130 * 60_000)).toBe("2h 10m");
    expect(formatTokens(1_800_000)).toBe("1.8M");
    expect(formatTokens(12_400)).toBe("12K");
  });

  it("compares today with the average of past active days", () => {
    expect(comparedToAverage([5, 0, 5, 10])).toBe("+100% vs your daily avg");
    expect(comparedToAverage([0, 0, 3])).toBe("First day tracked");
  });
});

describe("compactTokens", () => {
  it("reads like the token count Claude Code shows", () => {
    expect(compactTokens(820)).toBe("820");
    expect(compactTokens(1400)).toBe("1.4k");
    expect(compactTokens(2000)).toBe("2k");
    expect(compactTokens(23_600)).toBe("24k");
  });
});
