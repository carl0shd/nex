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
  };
}
