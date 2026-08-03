import { cn } from '@/lib/utils';

function Chip({ className, ...props }: React.ComponentProps<'span'>): React.JSX.Element {
  return (
    <span
      data-slot="chip"
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-[3px] bg-bg-raised px-1.5 py-0.5 text-[9px] font-medium text-text-muted',
        className
      )}
      {...props}
    />
  );
}

export default Chip;
