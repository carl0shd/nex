import { cn } from '@/lib/utils';

function Chip({ className, ...props }: React.ComponentProps<'span'>): React.JSX.Element {
  return (
    <span
      data-slot="chip"
      className={cn(
        'inline-flex h-[18px] shrink-0 items-center gap-1 rounded-chip bg-muted px-1.5 text-3xs font-medium text-ink-3',
        className
      )}
      {...props}
    />
  );
}

export default Chip;
