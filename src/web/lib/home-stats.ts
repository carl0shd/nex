import type { UsageSummary } from "@native/usage/types";
import { activeLimit, comparedToAverage, formatUsd, sessionForecast } from "@/lib/usage";

export interface HomeStatsData {
  tasks: { working: number; waiting: number; idle: number };
  spend?: { today: string; compared: string };
  limit?: { label: string; percent: number; resetsIn: string };
  environments?: { running: number; usedGb: number; totalGb: number };
}

export function usageStats(
  summary: UsageSummary | null,
  now: Date,
): Pick<HomeStatsData, "spend" | "limit"> {
  if (!summary) return {};
  const account = summary.accounts.find((item) => item.isDefault) ?? summary.accounts[0];
  const spend = {
    today: formatUsd(summary.today.total.costUsd),
    compared: comparedToAverage(summary.trend.map((day) => day.costUsd)),
  };
  if (!account) return { spend };
  const { window, percent, resetsAt } = activeLimit(account);
  const forecast = sessionForecast(percent, resetsAt, now, window);
  return {
    spend,
    limit: {
      label: window === "session" ? "Session limit" : "Weekly limit",
      percent: forecast.percent,
      resetsIn: forecast.resetsIn === "—" ? "No session running" : `Resets in ${forecast.resetsIn}`,
    },
  };
}
