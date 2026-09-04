import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const meterFill = cva('block h-full rounded-full', {
  variants: {
    tone: {
      normal: 'bg-badge-warning-text/70',
      warning: 'bg-badge-warning-text',
      critical: 'bg-badge-error-text',
      cost: 'bg-chart-cost',
      muted: 'bg-text-muted/50'
    }
  },
  defaultVariants: { tone: 'normal' }
});

const meterTrack = cva('block overflow-hidden rounded-full', {
  variants: {
    tone: {
      normal: 'bg-badge-warning-text/10',
      warning: 'bg-badge-warning-text/10',
      critical: 'bg-badge-error-text/15',
      cost: 'bg-chart-cost/15',
      muted: 'bg-text-muted/15'
    }
  },
  defaultVariants: { tone: 'normal' }
});

interface MeterBarProps extends VariantProps<typeof meterFill> {
  percent: number;
  className?: string;
  label?: string;
}

function MeterBar({ percent, tone, className, label }: MeterBarProps): React.JSX.Element {
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <span
      data-slot="meter-bar"
      role="meter"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn(meterTrack({ tone }), 'h-1 w-full', className)}
    >
      <span className={cn(meterFill({ tone }))} style={{ width: `${clamped}%` }} />
    </span>
  );
}

export default MeterBar;
