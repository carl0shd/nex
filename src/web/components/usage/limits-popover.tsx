import { useState } from 'react';
import type { UsageSummary } from '@native/usage/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import AccountLimitRow from '@/components/usage/account-limit-row';
import UsagePopoverFooter from '@/components/usage/usage-popover-footer';
import PanelSection from '@/components/ui/panel-section';

interface LimitsPopoverProps {
  summary: UsageSummary | null;
  children: React.ReactNode;
}

function LimitsPopover({ summary, children }: LimitsPopoverProps): React.JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="start" className="flex w-88 flex-col gap-2.5 p-2.5">
        {!summary ? (
          <p className="py-4 text-center text-xs text-text-muted">Loading limits…</p>
        ) : (
          <>
            <PanelSection
              title="Plan limits"
              trailing={
                summary.worstAccountName && summary.accounts.length > 1 ? (
                  <span className="text-[10px] text-text-muted">
                    highest · {summary.worstAccountName}
                  </span>
                ) : undefined
              }
            >
              {summary.accounts.length === 0 ? (
                <p className="py-2 text-[11px] text-text-muted">No agent account connected yet.</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {summary.accounts.map((account, index) => (
                    <div key={account.accountId} className="flex flex-col gap-2.5">
                      {index > 0 && <Separator />}
                      <AccountLimitRow account={account} />
                    </div>
                  ))}
                </div>
              )}
            </PanelSection>

            <Separator />
            <UsagePopoverFooter onNavigate={() => setOpen(false)} />
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default LimitsPopover;
