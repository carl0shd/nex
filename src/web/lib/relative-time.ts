const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function relativeTime(then: number, now: number): string {
  const elapsed = Math.max(now - then, 0);
  if (elapsed < MINUTE) return "just now";
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m ago`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h ago`;
  if (elapsed < 2 * DAY) return "yesterday";
  return `${Math.floor(elapsed / DAY)}d ago`;
}

const plural = (count: number, unit: string) => `${count} ${unit}${count === 1 ? "" : "s"} ago`;

export function relativeTimeLong(then: number, now: number): string {
  const elapsed = Math.max(now - then, 0);
  if (elapsed < MINUTE) return "just now";
  if (elapsed < HOUR) return plural(Math.floor(elapsed / MINUTE), "minute");
  if (elapsed < DAY) return plural(Math.floor(elapsed / HOUR), "hour");
  if (elapsed < 2 * DAY) return "yesterday";
  return plural(Math.floor(elapsed / DAY), "day");
}

export function exactTime(then: number): string {
  const date = new Date(then);
  const day = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${day} at ${time}`;
}
