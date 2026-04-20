import {
  Popover as HPopover,
  PopoverButton,
  PopoverPanel,
  type PopoverPanelProps
} from '@headlessui/react';

type Anchor = PopoverPanelProps['anchor'];

interface PopoverProps {
  trigger: React.ReactNode | ((open: boolean) => React.ReactNode);
  children: React.ReactNode | ((ctx: { close: () => void }) => React.ReactElement);
  anchor?: Anchor;
  gap?: number;
  className?: string;
}

function Popover({
  trigger,
  children,
  anchor = 'right start',
  gap = 8,
  className = ''
}: PopoverProps): React.JSX.Element {
  return (
    <HPopover>
      {({ open }) => (
        <>
          <PopoverButton as="div" className="cursor-pointer outline-none">
            {typeof trigger === 'function' ? trigger(open) : trigger}
          </PopoverButton>
          <PopoverPanel
            portal
            anchor={anchor}
            transition
            style={{ '--anchor-gap': `${gap}px` } as React.CSSProperties}
            className={`z-50 transition-opacity duration-100 ease-out data-closed:opacity-0 ${className}`}
          >
            {children}
          </PopoverPanel>
        </>
      )}
    </HPopover>
  );
}

export default Popover;
