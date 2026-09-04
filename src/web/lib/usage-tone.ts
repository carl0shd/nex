export type LimitTone = 'normal' | 'warning' | 'critical';

const WARNING_AT = 75;
const CRITICAL_AT = 90;

export function limitTone(percent: number | null, severity?: string): LimitTone {
  if (severity === 'critical' || severity === 'serious') return 'critical';
  if (severity === 'warning') return 'warning';

  if (percent === null) return 'normal';
  if (percent >= CRITICAL_AT) return 'critical';
  if (percent >= WARNING_AT) return 'warning';
  return 'normal';
}

export const CATEGORICAL_BAR_CLASSES = [
  'bg-chart-1',
  'bg-chart-2',
  'bg-chart-3',
  'bg-chart-4',
  'bg-chart-5'
] as const;

export function categoricalBarClass(index: number): string {
  return CATEGORICAL_BAR_CLASSES[index % CATEGORICAL_BAR_CLASSES.length];
}
