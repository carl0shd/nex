import { Zap } from 'lucide-react';
import PillButton from '@/components/ui/pill-button';
import MeterBar from '@/components/ui/meter-bar';
import type { LimitTone } from '@/lib/usage-tone';
import { cn } from '@/lib/utils';

interface TokensBadgeProps extends React.ComponentProps<'button'> {
  percent: number | null;
  tone: LimitTone;
}

const ICON_TONE: Record<LimitTone, string> = {
  normal: 'text-orange/70',
  warning: 'text-orange',
  critical: 'text-red'
};

const VALUE_TONE: Record<LimitTone, string> = {
  normal: 'text-orange/50',
  warning: 'text-orange/80',
  critical: 'text-red'
};

function TokensBadge({ percent, tone, className, ...props }: TokensBadgeProps): React.JSX.Element {
  return (
    <PillButton title="Plan limits" className={cn('gap-2', className)} {...props}>
      <Zap size={11} className={cn('shrink-0', ICON_TONE[tone])} strokeWidth={2} />
      <MeterBar percent={percent ?? 0} tone={tone} className="w-14" label="Plan limit used" />
      <span className={cn('tabular-nums', VALUE_TONE[tone])}>
        {percent === null ? '—' : `${Math.round(percent)}%`}
      </span>
    </PillButton>
  );
}

export default TokensBadge;
