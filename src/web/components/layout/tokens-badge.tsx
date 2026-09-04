import { Zap } from 'lucide-react';
import MeterBar from '@/components/ui/meter-bar';
import type { LimitTone } from '@/lib/usage-tone';
import { cn } from '@/lib/utils';

interface TokensBadgeProps extends React.ComponentProps<'button'> {
  percent: number | null;
  tone: LimitTone;
}

const ICON_TONE: Record<LimitTone, string> = {
  normal: 'text-badge-warning-text/70',
  warning: 'text-badge-warning-text',
  critical: 'text-badge-error-text'
};

const VALUE_TONE: Record<LimitTone, string> = {
  normal: 'text-badge-warning-text/50',
  warning: 'text-badge-warning-text/80',
  critical: 'text-badge-error-text'
};

function TokensBadge({ percent, tone, className, ...props }: TokensBadgeProps): React.JSX.Element {
  return (
    <button
      type="button"
      title="Plan limits"
      className={cn(
        'inline-flex cursor-pointer items-center gap-2 rounded-full bg-accent/40 px-2.5 py-0.5 text-[11px] font-medium select-none hover:bg-accent',
        className
      )}
      {...props}
    >
      <Zap size={11} className={cn('shrink-0', ICON_TONE[tone])} strokeWidth={2} />
      <MeterBar percent={percent ?? 0} tone={tone} className="w-14" label="Plan limit used" />
      <span className={cn('tabular-nums', VALUE_TONE[tone])}>
        {percent === null ? '—' : `${Math.round(percent)}%`}
      </span>
    </button>
  );
}

export default TokensBadge;
