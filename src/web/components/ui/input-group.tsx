import { Slot } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

function InputGroup({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'div'> & { asChild?: boolean }): React.JSX.Element {
  const Comp = asChild ? Slot.Root : 'div';

  return (
    <Comp
      data-slot="input-group"
      className={cn(
        'flex items-center gap-2 rounded-[5px] border border-input bg-bg-input px-2.5 py-2 not-focus-within:hover:border-border focus-within:border-border has-disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

const inputGroupAddonVariants = cva('flex shrink-0 items-center gap-1.5 text-text-muted', {
  variants: {
    align: {
      'inline-start': 'order-first',
      'inline-end': 'order-last'
    }
  },
  defaultVariants: {
    align: 'inline-start'
  }
});

function InputGroupAddon({
  className,
  align,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof inputGroupAddonVariants>): React.JSX.Element {
  return (
    <div
      data-slot="input-group-addon"
      className={cn(inputGroupAddonVariants({ align, className }))}
      {...props}
    />
  );
}

function InputGroupInput({
  className,
  ...props
}: React.ComponentProps<'input'>): React.JSX.Element {
  return (
    <input
      type="text"
      data-slot="input-group-control"
      className={cn(
        'min-w-0 flex-1 bg-transparent text-[12px] text-text-secondary outline-none placeholder:text-text-placeholder focus:text-text disabled:pointer-events-none',
        className
      )}
      {...props}
    />
  );
}

export { InputGroup, InputGroupAddon, InputGroupInput };
