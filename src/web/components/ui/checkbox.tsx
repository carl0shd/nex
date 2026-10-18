import { Checkbox as CheckboxPrimitive } from 'radix-ui';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>): React.JSX.Element {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'interactive press flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-control border border-line-strong bg-field outline-none hover:border-line-hover data-[state=checked]:border-transparent data-[state=checked]:bg-primary data-[state=checked]:shadow-solid disabled:pointer-events-none disabled:opacity-40',
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="text-primary-foreground duration-150 ease-out-strong data-[state=checked]:animate-in data-[state=checked]:zoom-in-50"
      >
        <Check size={11} strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
