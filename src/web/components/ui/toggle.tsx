import { Toggle as TogglePrimitive } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const toggleVariants = cva(
  'interactive press inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-control text-xs font-medium whitespace-nowrap text-ink-3 outline-none select-none hover:bg-hover-2 hover:text-ink data-[state=on]:bg-surface data-[state=on]:text-ink data-[state=on]:shadow-btn disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        outline: 'shadow-hairline bg-transparent'
      },
      size: {
        default: 'h-7 min-w-7 px-2',
        sm: 'h-6 min-w-6 px-1.5',
        lg: 'h-8 min-w-8 px-2.5'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>): React.JSX.Element {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Toggle, toggleVariants };
