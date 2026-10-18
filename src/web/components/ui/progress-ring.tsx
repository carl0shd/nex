import { cn } from '@/lib/utils';

type ProgressRingTone = 'primary' | 'green' | 'orange' | 'red';

interface ProgressRingProps {
  progress: number;
  tone?: ProgressRingTone;
  size?: number;
  children?: React.ReactNode;
  className?: string;
}

const STROKE = 2;

const TONE_STROKE: Record<ProgressRingTone, string> = {
  primary: 'stroke-primary',
  green: 'stroke-green',
  orange: 'stroke-orange',
  red: 'stroke-red'
};

function ProgressRing({
  progress,
  tone = 'primary',
  size = 28,
  children,
  className
}: ProgressRingProps): React.JSX.Element {
  const radius = (size - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, progress));

  return (
    <span
      data-slot="progress-ring"
      role="progressbar"
      aria-valuenow={Math.round(clamped * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-line"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
          className={cn(
            'transition-[stroke-dashoffset] duration-500 ease-out-strong',
            TONE_STROKE[tone]
          )}
        />
      </svg>
      <span className="relative text-3xs font-semibold text-ink tabular-nums">{children}</span>
    </span>
  );
}

export default ProgressRing;
