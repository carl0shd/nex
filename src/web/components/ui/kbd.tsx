import { cn } from '@/lib/utils';

function Kbd({ className, ...props }: React.ComponentProps<'kbd'>): React.JSX.Element {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        'flex h-[18px] min-w-[18px] select-none items-center justify-center rounded-control bg-muted px-1 text-center font-[system-ui] text-3xs leading-none font-medium text-ink-3 shadow-[inset_0_0_0_1px_var(--line),inset_0_-1px_0_var(--line-strong)]',
        className
      )}
      {...props}
    />
  );
}

function KbdGroup({ className, ...props }: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div data-slot="kbd-group" className={cn('flex items-center gap-1', className)} {...props} />
  );
}

export { Kbd, KbdGroup };
