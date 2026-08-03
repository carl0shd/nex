import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type Side = 'top' | 'right' | 'bottom' | 'left';
type Align = 'start' | 'center' | 'end';

interface PopoverMenuProps {
  trigger: React.ReactNode | ((open: boolean) => React.ReactNode);
  children: React.ReactNode | ((ctx: { close: () => void }) => React.ReactNode);
  /** `"<side> <align>"`, e.g. `"right start"`. */
  anchor?: string;
  gap?: number;
  className?: string;
}

function parseAnchor(anchor: string): { side: Side; align: Align } {
  const [side, align] = anchor.split(' ');
  return { side: (side as Side) ?? 'bottom', align: (align as Align) ?? 'center' };
}

/**
 * Popover that owns its open state and renders bare content — the caller styles the surface.
 * For a standard shadcn popover surface, compose `Popover`/`PopoverContent` directly.
 */
function PopoverMenu({
  trigger,
  children,
  anchor = 'right start',
  gap = 8,
  className
}: PopoverMenuProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const { side, align } = parseAnchor(anchor);
  const close = (): void => setOpen(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="cursor-pointer outline-none">
          {typeof trigger === 'function' ? trigger(open) : trigger}
        </div>
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        sideOffset={gap}
        className={cn('rounded-none border-0 bg-transparent p-0 shadow-none', className)}
      >
        {typeof children === 'function' ? children({ close }) : children}
      </PopoverContent>
    </Popover>
  );
}

export default PopoverMenu;
