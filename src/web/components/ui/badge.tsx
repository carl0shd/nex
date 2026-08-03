import { Slot } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex shrink-0 select-none items-center justify-center gap-1 rounded-full whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'text-badge-default-text',
        success: 'text-badge-success-text',
        warning: 'text-badge-warning-text',
        info: 'text-badge-info-text',
        destructive: 'text-badge-error-text'
      },
      tone: {
        solid: '',
        soft: ''
      },
      size: {
        sm: 'px-1.5 py-px text-[9px] font-semibold',
        md: 'px-2 py-0.5 text-[11px] font-medium'
      }
    },
    compoundVariants: [
      { variant: 'default', tone: 'solid', class: 'bg-badge-default-bg' },
      { variant: 'success', tone: 'solid', class: 'bg-badge-success-bg' },
      { variant: 'warning', tone: 'solid', class: 'bg-badge-warning-bg' },
      { variant: 'info', tone: 'solid', class: 'bg-badge-info-bg' },
      { variant: 'destructive', tone: 'solid', class: 'bg-badge-error-bg' },
      { variant: 'default', tone: 'soft', class: 'bg-badge-default-bg-soft' },
      { variant: 'success', tone: 'soft', class: 'bg-badge-success-bg-soft' },
      { variant: 'warning', tone: 'soft', class: 'bg-badge-warning-bg-soft' },
      { variant: 'info', tone: 'soft', class: 'bg-badge-info-bg-soft' },
      { variant: 'destructive', tone: 'soft', class: 'bg-badge-error-bg-soft' }
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
