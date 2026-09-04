import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { UsageGranularity } from '@native/usage/types';
import SettingsPanel from '@/components/settings/settings-panel';
import IconButton from '@/components/ui/icon-button';
import RankedBarList, { type RankedBarItem } from '@/components/ui/ranked-bar-list';
import SegmentedControl from '@/components/ui/segmented-control';
import { Separator } from '@/components/ui/separator';
import StackedBarChart, { type StackedBarDatum } from '@/components/ui/stacked-bar-chart';
import StatTile from '@/components/ui/stat-tile';
import AccountLimitRow from '@/components/usage/account-limit-row';
import PanelSection from '@/components/ui/panel-section';
import {
  formatBucketRange,
  formatDayLabel,
  formatTokens,
  formatUsd,
  shortModelName,
  totalTokenCount
} from '@/lib/usage-format';
import { categoricalBarClass } from '@/lib/usage-tone';
import { useUsageStore } from '@/stores/usage.store';

const GRANULARITY_OPTIONS = [
  { value: 'day' as const, label: 'Day' },
  { value: 'week' as const, label: 'Week' },
  { value: 'month' as const, label: 'Month' }
];

const MAX_SESSION_ROWS = 12;

function UsagePanel(): React.JSX.Element {
  const [granularity, setGranularity] = useState<UsageGranularity>('day');
  const stats = useUsageStore((s) => s.stats[granularity]);
  const summary = useUsageStore((s) => s.summary);
  const statsLoading = useUsageStore((s) => s.statsLoading);
  const statsVersion = useUsageStore((s) => s.statsVersion);
  const loadStats = useUsageStore((s) => s.loadStats);
  const refresh = useUsageStore((s) => s.refresh);

  useEffect(() => {
    void loadStats();
  }, [loadStats, statsVersion]);

  const chartData: StackedBarDatum[] = (stats?.buckets ?? []).map((bucket) => ({
    key: bucket.startDay,
    label: formatDayLabel(bucket.startDay, granularity),
    caption: formatBucketRange(bucket.startDay, bucket.endDay),
    total: bucket.costUsd,
    highlight: bucket.inNexCostUsd
  }));

  const modelItems: RankedBarItem[] = (stats?.byModel ?? []).map((model, index) => ({
    key: model.model,
    label: shortModelName(model.model),
    sublabel: formatTokens(model.tokens),
    value: model.costUsd,
    barClass: categoricalBarClass(index)
  }));

  const accountItems: RankedBarItem[] = (stats?.byAccount ?? []).map((account) => ({
    key: account.accountId ?? 'unlinked',
    label: account.accountName,
    sublabel: formatTokens(account.tokens),
    value: account.costUsd
  }));

  const sessionItems: RankedBarItem[] = (stats?.sessions ?? [])
    .slice(0, MAX_SESSION_ROWS)
    .map((session) => ({
      key: session.sessionId,
      label: session.name,
      sublabel: session.projectName,
      value: session.totals.costUsd
    }));

  return (
    <SettingsPanel>
      <PanelSection
        title="Spend"
        trailing={
          <div className="flex items-center gap-2">
            <SegmentedControl<UsageGranularity>
              value={granularity}
              options={GRANULARITY_OPTIONS}
              onChange={setGranularity}
            />
            <IconButton
              icon={RefreshCw}
              size={13}
              title="Rescan usage"
              onClick={() => void refresh()}
            />
          </div>
        }
      >
        <div className="grid grid-cols-4 gap-2">
          <StatTile
            label="Total"
            value={formatUsd(stats?.total.costUsd ?? 0)}
            variant="hero"
            className="col-span-2"
          />
          <StatTile label="In Nex" value={formatUsd(stats?.inNexCostUsd ?? 0)} />
          <StatTile
            label="Tokens"
            value={formatTokens(stats ? totalTokenCount(stats.total.tokens) : 0)}
          />
        </div>

        <StackedBarChart
          className="pt-2"
          data={chartData}
          formatValue={formatUsd}
          highlightLabel="In Nex"
          restLabel="Outside Nex"
          emptyLabel={statsLoading ? 'Loading…' : 'No usage recorded in this range.'}
        />
      </PanelSection>

      <Separator />

      <div className="grid grid-cols-2 gap-8">
        <PanelSection title="By model">
          <RankedBarList
            items={modelItems}
            formatValue={formatUsd}
            emptyLabel="No usage recorded."
          />
        </PanelSection>

        <PanelSection title="By account">
          <RankedBarList
            items={accountItems}
            formatValue={formatUsd}
            emptyLabel="No usage recorded."
          />
        </PanelSection>
      </div>

      <Separator />

      <PanelSection title="Sessions">
        <RankedBarList
          items={sessionItems}
          formatValue={formatUsd}
          emptyLabel="No Nex session has recorded usage in this range."
        />
      </PanelSection>

      <Separator />

      <PanelSection title="Plan limits">
        {summary && summary.accounts.length > 0 ? (
          <div className="flex max-w-150 flex-col gap-4">
            {summary.accounts.map((account) => (
              <AccountLimitRow key={account.accountId} account={account} showCost={false} />
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-text-muted">No agent account connected yet.</p>
        )}
      </PanelSection>

      {stats?.historyStartDay && (
        <p className="text-[10px] text-text-muted">
          Nex has kept usage since {formatDayLabel(stats.historyStartDay, 'day')}. Claude Code
          prunes its own transcripts, so earlier activity is unavailable.
        </p>
      )}
    </SettingsPanel>
  );
}

export default UsagePanel;
