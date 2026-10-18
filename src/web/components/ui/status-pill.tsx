import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const statusPillVariants = cva(
  'inline-flex h-5 shrink-0 items-center gap-1.5 rounded-full px-2 text-2xs font-medium whitespace-nowrap select-none',
  {
    variants: {
      tone: {
        neutral: 'bg-hover-2 text-ink-2',
        primary: 'bg-primary-tint text-primary-ink',
        green: 'bg-green/14 text-green',
        orange: 'bg-orange/14 text-orange',
        red: 'bg-red/14 text-red',
        blue: 'bg-blue/14 text-blue'
      }
    },
    defaultVariants: { tone: 'neutral' }
  }
);

type StatusPillTone = NonNullable<VariantProps<typeof statusPillVariants>['tone']>;

const DOT_CLASS: Record<StatusPillTone, string> = {
  neutral: 'bg-ink-4',
  primary: 'bg-primary',
  green: 'bg-green',
  orange: 'bg-orange',
  red: 'bg-red',
  blue: 'bg-blue'
};

interface StatusPillProps
  extends React.ComponentProps<'span'>, VariantProps<typeof statusPillVariants> {
  dot?: boolean;
  pulse?: boolean;
}

function StatusPill({
  tone,
  dot = true,
  pulse = false,
  className,
  children,
  ...props
}: StatusPillProps): React.JSX.Element {
  return (
    <span
      data-slot="status-pill"
      className={cn(statusPillVariants({ tone }), className)}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'size-1.5 rounded-full',
            DOT_CLASS[tone ?? 'neutral'],
            pulse && 'animate-breathe'
          )}
        />
      )}
      {children}
    </span>
  );
}

export { StatusPill, statusPillVariants };
export type { StatusPillTone };
