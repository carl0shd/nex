const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function uptime(since: number, now: number): string {
  const elapsed = Math.max(now - since, 0);
  if (elapsed < MINUTE) return "<1m";
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m`;
  if (elapsed < DAY) {
    const minutes = Math.floor((elapsed % HOUR) / MINUTE);
    return `${Math.floor(elapsed / HOUR)}h${minutes ? ` ${minutes}m` : ""}`;
  }
  const hours = Math.floor((elapsed % DAY) / HOUR);
  return `${Math.floor(elapsed / DAY)}d${hours ? ` ${hours}h` : ""}`;
}
