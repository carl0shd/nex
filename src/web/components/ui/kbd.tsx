import { cn } from '@/lib/utils';

function Kbd({ className, ...props }: React.ComponentProps<'kbd'>): React.JSX.Element {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        'flex select-none items-center justify-center rounded border border-border-soft bg-bg-mute/50 px-1 py-0.5 text-center font-[system-ui] text-[10px] leading-none font-medium text-text-muted',
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
