import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const alertVariants = cva(
  'flex w-full items-start gap-2.5 rounded-card px-3 py-2.5 text-xs [&>svg]:mt-px [&>svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-hover text-ink-2 shadow-hairline [&>svg]:text-ink-3',
        warning:
          'bg-orange/10 text-orange shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--orange)_20%,transparent)]',
        destructive:
          'bg-red/10 text-red shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--red)_20%,transparent)]'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>): React.JSX.Element {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant, className }))}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>): React.JSX.Element {
  return <div data-slot="alert-title" className={cn('font-medium', className)} {...props} />;
}

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>): React.JSX.Element {
  return <div data-slot="alert-description" className={cn('flex-1', className)} {...props} />;
}

export { Alert, AlertDescription, AlertTitle, alertVariants };
