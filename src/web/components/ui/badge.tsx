import { Slot } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex shrink-0 select-none items-center justify-center gap-1 rounded-full whitespace-nowrap tabular-nums',
  {
    variants: {
      variant: {
        default: 'text-ink-2',
        success: 'text-green',
        warning: 'text-orange',
        info: 'text-blue',
        destructive: 'text-red'
      },
      tone: {
        solid: '',
        soft: ''
      },
      size: {
        sm: 'h-4 px-1.5 text-3xs font-semibold',
        md: 'h-5 px-2 text-2xs font-medium'
      }
    },
    compoundVariants: [
      { variant: 'default', tone: 'solid', class: 'bg-muted shadow-hairline' },
      {
        variant: 'success',
        tone: 'solid',
        class:
          'bg-green/14 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--green)_22%,transparent)]'
      },
      {
        variant: 'warning',
        tone: 'solid',
        class:
          'bg-orange/14 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--orange)_22%,transparent)]'
      },
      {
        variant: 'info',
        tone: 'solid',
        class: 'bg-blue/14 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--blue)_22%,transparent)]'
      },
      {
        variant: 'destructive',
        tone: 'solid',
        class: 'bg-red/14 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--red)_22%,transparent)]'
      },
      { variant: 'default', tone: 'soft', class: 'bg-hover-2' },
      { variant: 'success', tone: 'soft', class: 'bg-green/10' },
      { variant: 'warning', tone: 'soft', class: 'bg-orange/10' },
      { variant: 'info', tone: 'soft', class: 'bg-blue/10' },
      { variant: 'destructive', tone: 'soft', class: 'bg-red/10' }
    ],
    defaultVariants: {
      variant: 'default',
      tone: 'solid',
      size: 'md'
    }
  }
);

type BadgeProps = React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean;
  };

function Badge({
  className,
  variant,
  tone,
  size,
  asChild = false,
  ...props
}: BadgeProps): React.JSX.Element {
  const Comp = asChild ? Slot.Root : 'span';

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, tone, size, className }))}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
