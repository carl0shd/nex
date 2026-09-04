import { useState } from 'react';
import { cn } from '@/lib/utils';

interface StackedBarDatum {
  key: string;
  label: string;
  caption: string;
  total: number;
  highlight: number;
}

interface StackedBarChartProps {
  data: StackedBarDatum[];
  formatValue: (value: number) => string;
  highlightLabel: string;
  restLabel: string;
  emptyLabel: string;
  height?: number;
  className?: string;
}

const AXIS_LABEL_TARGET = 6;

function LegendSwatch({
  className,
  label
}: {
  className: string;
  label: string;
}): React.JSX.Element {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] text-text-muted">
      <span className={cn('size-2 rounded-[2px]', className)} />
      {label}
    </span>
  );
}

function StackedBarChart({
  data,
  formatValue,
  highlightLabel,
  restLabel,
  emptyLabel,
  height = 112,
  className
}: StackedBarChartProps): React.JSX.Element {
  const [focusedKey, setFocusedKey] = useState<string | null>(null);

  const max = Math.max(...data.map((datum) => datum.total), 0);
  const focused = data.find((datum) => datum.key === focusedKey) ?? null;
  const labelEvery = Math.max(1, Math.ceil(data.length / AXIS_LABEL_TARGET));

  if (data.length === 0 || max === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg border border-border-soft text-xs text-text-muted',
          className
        )}
        style={{ height }}
      >
        {emptyLabel}
      </div>
    );
  }

  return (
    <div data-slot="stacked-bar-chart" className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex items-center gap-3">
          <LegendSwatch className="bg-chart-cost" label={highlightLabel} />
          <LegendSwatch className="bg-text-muted/40" label={restLabel} />
        </div>
        <div className="flex items-baseline gap-2 text-[11px]">
          {focused ? (
            <>
              <span className="text-text-muted">{focused.caption}</span>
              <span className="font-mono text-text tabular-nums">{formatValue(focused.total)}</span>
            </>
          ) : (
            <span className="text-text-muted">peak {formatValue(max)}</span>
          )}
        </div>
      </div>

      <div
        className="flex items-end gap-[3px] border-b border-border-soft"
        style={{ height }}
        onMouseLeave={() => setFocusedKey(null)}
      >
        {data.map((datum) => {
          const rest = Math.max(datum.total - datum.highlight, 0);
          const dim = focusedKey !== null && focusedKey !== datum.key;

          return (
            <div
              key={datum.key}
              onMouseEnter={() => setFocusedKey(datum.key)}
              className="flex h-full min-w-0 flex-1 cursor-default flex-col justify-end gap-[2px] select-none"
            >
              {rest > 0 && (
                <span
                  className={cn(
                    'block w-full rounded-t-[3px] bg-text-muted/40',
                    dim && 'opacity-40'
                  )}
                  style={{ height: `${(rest / max) * 100}%` }}
                />
              )}
              {datum.highlight > 0 && (
                <span
                  className={cn(
                    'block w-full bg-chart-cost',
                    rest > 0 ? 'rounded-b-[1px]' : 'rounded-t-[3px]',
                    dim && 'opacity-40'
                  )}
                  style={{ height: `${(datum.highlight / max) * 100}%` }}
                />
              )}
              {datum.total === 0 && <span className="block h-[2px] w-full bg-text-muted/15" />}
            </div>
          );
        })}
      </div>

      <div className="flex gap-[3px]">
        {data.map((datum, index) => (
          <span
            key={datum.key}
            className="min-w-0 flex-1 text-center text-[10px] whitespace-nowrap text-text-muted"
          >
            {index % labelEvery === 0 ? datum.label : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

export default StackedBarChart;
export type { StackedBarDatum };
