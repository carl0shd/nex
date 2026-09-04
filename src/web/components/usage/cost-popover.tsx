import { useState } from 'react';
import type { UsageSummary } from '@native/usage/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import RankedBarList, { type RankedBarItem } from '@/components/ui/ranked-bar-list';
import Sparkline from '@/components/ui/sparkline';
import StatTile from '@/components/ui/stat-tile';
import UsagePopoverFooter from '@/components/usage/usage-popover-footer';
import PanelSection from '@/components/ui/panel-section';
import { formatDayLabel, formatTokens, formatUsd, totalTokenCount } from '@/lib/usage-format';

const MAX_SESSION_ROWS = 6;

interface CostPopoverProps {
  summary: UsageSummary | null;
  children: React.ReactNode;
}

function sessionItems(summary: UsageSummary): RankedBarItem[] {
  return summary.sessions
    .filter((session) => session.totals.costUsd > 0)
    .slice(0, MAX_SESSION_ROWS)
    .map((session) => ({
      key: session.sessionId,
      label: session.name,
      sublabel: formatTokens(totalTokenCount(session.totals.tokens)),
      value: session.totals.costUsd
    }));
}

function CostPopover({ summary, children }: CostPopoverProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [focusedDay, setFocusedDay] = useState<string | null>(null);

  const focused = summary?.trend.find((point) => point.day === focusedDay) ?? null;
  const trendTotal = (summary?.trend ?? []).reduce((sum, point) => sum + point.costUsd, 0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="start" className="flex w-84 flex-col gap-2 p-2.5">
        {!summary ? (
          <p className="py-4 text-center text-xs text-text-muted">Loading usage…</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-1">
              <StatTile
                size="compact"
                surface="menu"
                label="Today"
                value={formatUsd(summary.today.total.costUsd)}
                sublabel={`${formatTokens(totalTokenCount(summary.today.total.tokens))} tokens`}
                variant="hero"
                className="col-span-3"
              />
              <StatTile
                size="compact"
                surface="menu"
                label="In Nex"
                value={formatUsd(summary.today.inNex.costUsd)}
              />
              <StatTile
                size="compact"
                surface="menu"
                label="Outside"
                value={formatUsd(summary.today.outsideNex.costUsd)}
              />
              <StatTile
                size="compact"
                surface="menu"
                label="Sessions"
                value={String(summary.sessions.filter((s) => s.totals.costUsd > 0).length)}
              />
            </div>

            <PanelSection
              title="Last 14 days"
              trailing={
                <span className="font-mono text-[11px] text-text-secondary tabular-nums">
                  {focused
                    ? `${formatDayLabel(focused.day, 'day')} · ${formatUsd(focused.costUsd)}`
                    : formatUsd(trendTotal)}
                </span>
              }
            >
              <Sparkline
                ariaLabel="Daily cost over the last 14 days"
                points={summary.trend.map((point) => ({ key: point.day, value: point.costUsd }))}
                focusedKey={focusedDay}
                onFocusChange={setFocusedDay}
              />
            </PanelSection>

            <Separator />

            <PanelSection title="Open sessions">
              <RankedBarList
                items={sessionItems(summary)}
                formatValue={formatUsd}
                emptyLabel="No session has recorded usage yet."
              />
            </PanelSection>

            <Separator />
            <UsagePopoverFooter onNavigate={() => setOpen(false)} />
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default CostPopover;
