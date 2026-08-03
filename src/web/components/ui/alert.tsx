import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const alertVariants = cva(
  'flex w-full items-start gap-2 rounded-md border px-2.5 py-2 text-[11px] leading-relaxed [&>svg]:mt-0.5 [&>svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'border-border-soft bg-bg-raised text-text-secondary',
        warning: 'border-badge-warning-text/30 bg-badge-warning-bg/40 text-badge-warning-text',
        destructive: 'border-destructive/30 bg-destructive/10 text-destructive-text'
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
