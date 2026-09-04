import { cn } from '@/lib/utils';

interface SparklinePoint {
  key: string;
  value: number;
}

interface SparklineProps {
  points: SparklinePoint[];
  focusedKey?: string | null;
  onFocusChange?: (key: string | null) => void;
  className?: string;
  ariaLabel: string;
}

const MIN_VISIBLE_FRACTION = 0.08;

function Sparkline({
  points,
  focusedKey,
  onFocusChange,
  className,
  ariaLabel
}: SparklineProps): React.JSX.Element {
  const max = Math.max(...points.map((point) => point.value), 0);

  return (
    <div
      data-slot="sparkline"
      role="img"
      aria-label={ariaLabel}
      className={cn('flex h-8 items-end gap-px', className)}
      onMouseLeave={() => onFocusChange?.(null)}
    >
      {points.map((point) => {
        const fraction = max > 0 ? point.value / max : 0;
        const height = point.value > 0 ? Math.max(fraction, MIN_VISIBLE_FRACTION) : 0;
        const dim = focusedKey !== null && focusedKey !== point.key;

        return (
          <span
            key={point.key}
            onMouseEnter={() => onFocusChange?.(point.key)}
            className="flex h-full flex-1 cursor-default items-end select-none"
          >
            <span
              className={cn(
                'block w-full rounded-t-[1px]',
                point.value > 0 ? 'bg-chart-cost' : 'h-px bg-text-muted/25',
                dim && 'opacity-45'
              )}
              style={point.value > 0 ? { height: `${height * 100}%` } : undefined}
            />
          </span>
        );
      })}
    </div>
  );
}

export default Sparkline;
export type { SparklinePoint };
