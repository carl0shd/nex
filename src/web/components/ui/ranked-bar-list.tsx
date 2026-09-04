import { cn } from '@/lib/utils';

interface RankedBarItem {
  key: string;
  label: string;
  sublabel?: string;
  value: number;
  barClass?: string;
}

interface RankedBarListProps {
  items: RankedBarItem[];
  formatValue: (value: number) => string;
  emptyLabel: string;
  className?: string;
}

function RankedBarList({
  items,
  formatValue,
  emptyLabel,
  className
}: RankedBarListProps): React.JSX.Element {
  if (items.length === 0) {
    return <p className={cn('py-1 text-[11px] text-text-muted', className)}>{emptyLabel}</p>;
  }

  const max = Math.max(...items.map((item) => item.value), 0);

  return (
    <ul data-slot="ranked-bar-list" className={cn('flex flex-col gap-1.5', className)}>
      {items.map((item) => (
        <li key={item.key} className="flex flex-col gap-0.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-xs text-text-secondary">{item.label}</span>
            <span className="shrink-0 font-mono text-[11px] text-text tabular-nums">
              {formatValue(item.value)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="block h-1 flex-1 overflow-hidden rounded-full bg-text-muted/15">
              <span
                className={cn('block h-full rounded-full', item.barClass ?? 'bg-chart-cost')}
                style={{ width: `${max > 0 ? Math.max((item.value / max) * 100, 2) : 0}%` }}
              />
            </span>
            {item.sublabel && (
              <span className="shrink-0 text-[10px] text-text-muted">{item.sublabel}</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

export default RankedBarList;
export type { RankedBarItem };
