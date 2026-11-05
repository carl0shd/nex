import { activeLimit, sessionForecast, type AccountLimits } from "@/lib/usage";

const DEFAULT_THRESHOLDS = [80, 95];
const RESET_ROUNDING_MS = 10 * 60_000;

export interface LimitWarning {
  key: string;
  threshold: number;
  title: string;
  body: string;
}

export function limitWarning(
  account: AccountLimits & { accountId: string },
  now: Date,
  thresholds: readonly number[] = DEFAULT_THRESHOLDS,
): LimitWarning | null {
  const limit = activeLimit(account);
  if (limit.percent === null || !limit.resetsAt || limit.resetsAt <= now) return null;
  const threshold = thresholds.filter((step) => (limit.percent ?? 0) >= step).at(-1);
  if (threshold === undefined) return null;
  const forecast = sessionForecast(limit.percent, limit.resetsAt, now, limit.window);
  const windowId = Math.round(limit.resetsAt.getTime() / RESET_ROUNDING_MS);
  return {
    key: `${account.accountId}:${limit.window}:${windowId}:${threshold}`,
    threshold,
    title: `${limit.window === "session" ? "Session" : "Weekly"} limit at ${forecast.percent}%`,
    body: `${forecast.forecast}. It resets at ${forecast.resetsAt}.`,
  };
}
