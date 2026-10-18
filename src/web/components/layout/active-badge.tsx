import PillButton from '@/components/ui/pill-button';
import { cn } from '@/lib/utils';

interface ActiveBadgeProps extends React.ComponentProps<'button'> {
  count: number;
}

function ActiveBadge({ count, className, ...props }: ActiveBadgeProps): React.JSX.Element {
  const idle = count === 0;

  return (
    <PillButton
      title="Open sessions"
      className={cn('tabular-nums', idle ? 'text-ink-3' : 'text-ink', className)}
      {...props}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          idle
            ? 'bg-ink-4'
            : 'bg-green shadow-[0_0_0_3px_color-mix(in_srgb,var(--green)_22%,transparent)]'
        )}
      />
      {count} active
    </PillButton>
  );
}

export default ActiveBadge;
