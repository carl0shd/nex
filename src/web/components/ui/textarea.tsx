import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>): React.JSX.Element {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex w-full resize-none rounded-[5px] border border-input bg-bg-input px-2.5 py-2 text-[11px] leading-relaxed text-text-secondary outline-none placeholder:text-text-placeholder not-focus-within:hover:border-border focus:border-border focus:text-text disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
