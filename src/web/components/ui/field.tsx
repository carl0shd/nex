import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

function Field({
  className,
  ...props
}: React.ComponentProps<'div'> & { 'data-disabled'?: boolean }): React.JSX.Element {
  return (
    <div
      role="group"
      data-slot="field"
      className={cn('group/field flex flex-col gap-1.5', className)}
      {...props}
    />
  );
}

function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>): React.JSX.Element {
  return <Label data-slot="field-label" className={className} {...props} />;
}

function FieldDescription({ className, ...props }: React.ComponentProps<'p'>): React.JSX.Element {
  return (
    <p
      data-slot="field-description"
      className={cn('text-[10px] leading-relaxed text-text-muted', className)}
      {...props}
    />
  );
}

function FieldError({ className, ...props }: React.ComponentProps<'span'>): React.JSX.Element {
  return (
    <span
      data-slot="field-error"
      className={cn('text-[10px] text-destructive-text', className)}
      {...props}
    />
  );
}

export { Field, FieldLabel, FieldDescription, FieldError };
