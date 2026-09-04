import type { TokenCounts } from '@native/usage/pricing';
import type { UsageGranularity } from '@native/usage/types';

export function totalTokenCount(tokens: TokenCounts): number {
  return (
    tokens.input + tokens.output + tokens.cacheWrite5m + tokens.cacheWrite1h + tokens.cacheRead
  );
}

export function formatUsd(amount: number): string {
  if (amount > 0 && amount < 0.01) return '<$0.01';
  return `$${amount.toFixed(2)}`;
}

export function formatCompactUsd(amount: number): string {
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}k`;
  return `$${amount.toFixed(2)}`;
}

export function formatTokens(count: number): string {
  if (count >= 1_000_000_000) return `${(count / 1_000_000_000).toFixed(1)}B`;
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

function dateOf(day: string): Date {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date, 12);
}

export function formatDayLabel(day: string, granularity: UsageGranularity): string {
  const date = dateOf(day);
  const options: Intl.DateTimeFormatOptions =
    granularity === 'month'
      ? { month: 'short', year: '2-digit' }
      : { month: 'short', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
}

export function formatBucketRange(startDay: string, endDay: string): string {
  if (startDay === endDay) {
    return dateOf(startDay).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }
  return `${formatDayLabel(startDay, 'day')} – ${formatDayLabel(endDay, 'day')}`;
}

export function formatResetIn(isoTimestamp: string | null): string | null {
  if (!isoTimestamp) return null;

  const remainingMs = new Date(isoTimestamp).getTime() - Date.now();
  if (Number.isNaN(remainingMs) || remainingMs <= 0) return null;

  const minutes = Math.round(remainingMs / 60_000);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const rest = minutes % 60;
    return rest > 0 ? `${hours}h ${rest}m` : `${hours}h`;
  }

  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

export function formatResetAt(isoTimestamp: string | null): string | null {
  if (!isoTimestamp) return null;

  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return null;

  const sameDay = date.toDateString() === new Date().toDateString();
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  if (sameDay) return `Resets today at ${time}`;

  const day = date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
  return `Resets ${day} at ${time}`;
}

export function shortModelName(model: string): string {
  return model.replace(/^claude-/, '').replace(/-\d{8}$/, '');
}
