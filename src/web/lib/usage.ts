export type UsageTone = "green" | "orange" | "red";

export function usageTone(percent: number): UsageTone {
  if (percent >= 85) return "red";
  if (percent >= 60) return "orange";
  return "green";
}

export interface Sparkline {
  points: string;
  averageTop: number;
  lastTop: number;
  tops: number[];
}

export function sparkline(values: readonly number[], height = 28, padding = 2): Sparkline {
  const max = Math.max(...values, 0) || 1;
  const yOf = (value: number) => padding + (1 - value / max) * (height - padding * 2);
  const step = values.length > 1 ? 100 / (values.length - 1) : 0;
  const points = values
    .map((value, index) => `${(index * step).toFixed(2)},${yOf(value).toFixed(2)}`)
    .join(" ");
  const history = values.slice(0, -1);
  const average = history.length
    ? history.reduce((sum, value) => sum + value, 0) / history.length
    : (values[0] ?? 0);
  const toPercent = (y: number) => Number(((y / height) * 100).toFixed(1));
  return {
    points,
    averageTop: toPercent(yOf(average)),
    lastTop: toPercent(yOf(values.at(-1) ?? 0)),
    tops: values.map((value) => toPercent(yOf(value))),
  };
}

export const SESSION_WINDOW_MS = 5 * 60 * 60_000;
export const WEEK_WINDOW_MS = 7 * 24 * 60 * 60_000;

export type LimitWindow = "session" | "weekly";

const WINDOW_MS: Record<LimitWindow, number> = {
  session: SESSION_WINDOW_MS,
  weekly: WEEK_WINDOW_MS,
};

export interface AccountLimits {
  fiveHourPercent: number | null;
  fiveHourResetsAt: string | null;
  sevenDayPercent: number | null;
  sevenDayResetsAt: string | null;
}

export function activeLimit(account: AccountLimits): {
  window: LimitWindow;
  percent: number | null;
  resetsAt: Date | null;
} {
  const weekly = account.fiveHourPercent === null && account.sevenDayPercent !== null;
  const resetsAt = weekly ? account.sevenDayResetsAt : account.fiveHourResetsAt;
  return {
    window: weekly ? "weekly" : "session",
    percent: weekly ? account.sevenDayPercent : account.fiveHourPercent,
    resetsAt: resetsAt ? new Date(resetsAt) : null,
  };
}

export interface SessionForecast {
  window: LimitWindow;
  percent: number;
  projected: number;
  resetsIn: string;
  startedAt: string;
  resetsAt: string;
  forecast: string;
}

export function formatDuration(ms: number): string {
  const minutes = Math.max(1, Math.round(ms / 60_000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return hours % 24 ? `${days}d ${hours % 24}h` : `${days}d`;
  }
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

const clockTime = (date: Date) =>
  date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

const dayTime = (date: Date) =>
  date.toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" });

export function sessionForecast(
  percent: number | null,
  resetsAt: Date | null,
  now: Date,
  window: LimitWindow = "session",
): SessionForecast {
  const used = Math.round(percent ?? 0);
  if (!resetsAt || resetsAt <= now) {
    return {
      window,
      percent: used,
      projected: used,
      resetsIn: "—",
      startedAt: "—",
      resetsAt: "—",
      forecast: "No session running right now",
    };
  }
  const startedAt = new Date(resetsAt.getTime() - WINDOW_MS[window]);
  const label = window === "session" ? clockTime : dayTime;
  const elapsed = Math.max(now.getTime() - startedAt.getTime(), 60_000);
  const perMs = used / elapsed;
  const projected = Math.min(100, Math.round(used + perMs * (resetsAt.getTime() - now.getTime())));
  const forecast =
    projected >= 100 && perMs > 0
      ? `At this pace you hit the limit in ~${formatDuration((100 - used) / perMs)}`
      : `At this pace you end the window around ${projected}%`;
  return {
    window,
    percent: used,
    projected,
    resetsIn: formatDuration(resetsAt.getTime() - now.getTime()),
    startedAt: window === "session" ? label(startedAt).replace(/\s?[AP]M$/, "") : label(startedAt),
    resetsAt: label(resetsAt),
    forecast,
  };
}

export function formatUsd(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function formatTokens(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${Math.round(count / 1_000)}K`;
  return String(count);
}

export function comparedToAverage(
  lastDays: readonly number[],
  index = lastDays.length - 1,
): string {
  const history = lastDays.filter((value, at) => at !== index && value > 0);
  const today = lastDays[index] ?? 0;
  if (history.length === 0) return "First day tracked";
  const average = history.reduce((sum, value) => sum + value, 0) / history.length;
  const change = Math.round(((today - average) / average) * 100);
  return `${change >= 0 ? "+" : ""}${change}% vs your daily avg`;
}

export function dayLabel(day: string, today: string): string {
  if (day === today) return "Today";
  const date = new Date(`${day}T12:00:00`);
  const yesterday = new Date(`${today}T12:00:00`);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function updatedLabel(updatedAt: Date, now: Date): string {
  const minutes = Math.floor((now.getTime() - updatedAt.getTime()) / 60_000);
  return minutes < 1 ? "Updated just now" : `Updated ${formatDuration(minutes * 60_000)} ago`;
}

export function compactTokens(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (count < 1000) return String(count);
  if (count < 10_000) return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${Math.round(count / 1000)}k`;
}
