import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>): React.JSX.Element {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex w-full resize-none py-2 leading-relaxed interactive rounded-control border border-line bg-field px-2.5 text-sm text-ink outline-none placeholder:text-ink-4 not-focus:hover:border-line-strong focus:border-ring/60 focus:ring-3 focus:ring-ring/15 disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
