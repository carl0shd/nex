import { AlertTriangle } from 'lucide-react';
import type { AccountUsage } from '@native/usage/types';
import MeterBar from '@/components/ui/meter-bar';
import { formatResetAt, formatResetIn, formatUsd } from '@/lib/usage-format';
import { limitTone } from '@/lib/usage-tone';
import { cn } from '@/lib/utils';

const STATUS_MESSAGE: Record<string, string> = {
  unauthenticated: 'Not signed in — run `claude auth login` for this account',
  expired: 'Credentials expired — run `claude auth login` to refresh',
  throttled: 'Rate limited by Anthropic — retrying shortly',
  error: 'Could not reach Anthropic'
};

interface AccountLimitRowProps {
  account: AccountUsage;
  showCost?: boolean;
}

function AccountLimitRow({ account, showCost = true }: AccountLimitRowProps): React.JSX.Element {
  const problem = STATUS_MESSAGE[account.status];

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate text-xs text-text">{account.accountName}</span>
        <div className="flex shrink-0 items-baseline gap-2">
          {account.subscriptionType && (
            <span className="text-[10px] text-text-muted capitalize">
              {account.subscriptionType}
            </span>
          )}
          {showCost && (
            <span className="font-mono text-[11px] text-text-secondary tabular-nums">
              {formatUsd(account.todayCostUsd)}
            </span>
          )}
        </div>
      </div>

      {problem ? (
        <p className="flex items-center gap-1.5 text-[11px] text-badge-warning-text">
          <AlertTriangle size={11} className="shrink-0" strokeWidth={2} />
          {problem}
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          <li className="flex items-center gap-2 text-[9px] tracking-wide text-text-muted/70 uppercase">
            <span className="w-28 shrink-0" />
            <span className="flex-1" />
            <span className="w-8 shrink-0 text-right">used</span>
            <span className="w-16 shrink-0 text-right">resets in</span>
          </li>
          {account.limits.map((limit) => {
            const tone = limitTone(limit.percent, limit.severity);
            const resetIn = formatResetIn(limit.resetsAt);
            const resetAt = formatResetAt(limit.resetsAt);

            return (
              <li key={`${limit.kind}-${limit.label}`} className="flex items-center gap-2">
                <span className="w-28 shrink-0 truncate text-[11px] text-text-secondary">
                  {limit.label}
                </span>
                <MeterBar percent={limit.percent} tone={tone} label={limit.label} />
                <span
                  className={cn(
                    'w-8 shrink-0 text-right font-mono text-[11px] tabular-nums',
                    tone === 'critical' ? 'text-badge-error-text' : 'text-text-secondary'
                  )}
                >
                  {Math.round(limit.percent)}%
                </span>
                <span
                  title={resetAt ?? undefined}
                  className="w-16 shrink-0 text-right font-mono text-[10px] text-text-muted tabular-nums"
                >
                  {resetIn ?? '—'}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default AccountLimitRow;
