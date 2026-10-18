import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuRowProps extends Omit<React.ComponentProps<'button'>, 'children'> {
  label: React.ReactNode;
  selected?: boolean;
  leading?: React.ReactNode;
}

function MenuRow({
  label,
  selected = false,
  leading,
  className,
  type = 'button',
  ...props
}: MenuRowProps): React.JSX.Element {
  return (
    <button
      type={type}
      data-glide-row
      data-slot="menu-row"
      className={cn(
        'interactive relative flex h-8 w-full cursor-pointer items-center gap-2 rounded-[7px] px-2 text-left text-sm outline-none select-none',
        selected ? 'text-ink' : 'text-ink-2 hover:text-ink',
        className
      )}
      {...props}
    >
      {leading}
      <span className="flex-1 truncate">{label}</span>
      {selected && <Check size={13} className="shrink-0 text-primary-ink" />}
    </button>
  );
}

export default MenuRow;
