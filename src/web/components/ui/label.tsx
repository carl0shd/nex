import { Label as LabelPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>): React.JSX.Element {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        'flex select-none items-center gap-2 text-[10px] font-medium text-text-muted group-data-[disabled=true]/field:opacity-50 peer-disabled:cursor-default peer-disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

export { Label };
