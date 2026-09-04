import { cn } from '@/lib/utils';

interface ActiveBadgeProps extends React.ComponentProps<'button'> {
  count: number;
}

function ActiveBadge({ count, className, ...props }: ActiveBadgeProps): React.JSX.Element {
  const idle = count === 0;

  return (
    <button
      type="button"
      title="Open sessions"
      className={cn(
        'inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium select-none',
        idle
          ? 'bg-bg-mute text-text-muted hover:bg-bg-item-active'
          : 'bg-accent/40 text-badge-success-text hover:bg-accent',
        className
      )}
      {...props}
    >
      <span
        className={cn('size-1.5 rounded-full', idle ? 'bg-text-muted' : 'bg-badge-success-text')}
      />
      {count} active
    </button>
  );
}

export default ActiveBadge;
