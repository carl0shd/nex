import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>): React.JSX.Element {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex w-full min-w-0 rounded-[5px] border border-input bg-bg-input px-2.5 py-2 text-[12px] text-text-secondary outline-none placeholder:text-text-placeholder not-focus:hover:border-border focus:border-border focus:text-text disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

export { Input };
