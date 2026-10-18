import { cn } from '@/lib/utils';

function PillButton({
  className,
  type = 'button',
  ...props
}: React.ComponentProps<'button'>): React.JSX.Element {
  return (
    <button
      type={type}
      data-slot="pill-button"
      className={cn(
        'interactive press inline-flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-2xs font-medium whitespace-nowrap outline-none select-none hover:bg-hover-2 data-[state=open]:bg-hover-2',
        className
      )}
      {...props}
    />
  );
}

export default PillButton;
