import { Slot } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap select-none outline-none disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-accent-hover',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-bg-hover',
        outline:
          'border border-border-soft text-text-secondary hover:border-border hover:text-text',
        ghost: 'text-text-muted hover:bg-bg-mute hover:text-text-secondary',
        destructive:
          'border border-destructive bg-destructive text-destructive-foreground hover:bg-destructive-hover',
        link: 'text-text underline-offset-4 hover:underline'
      },
      size: {
        default: 'px-4 py-2 text-[13px]',
        sm: 'px-2.5 py-1 text-[11px]',
        lg: 'px-5 py-2.5 text-[14px]',
        icon: 'p-1.5',
        'icon-sm': 'p-1'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps): React.JSX.Element {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
export type { ButtonProps };
