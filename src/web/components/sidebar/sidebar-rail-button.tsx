import { cn } from '@/lib/utils';

interface SidebarRailButtonProps extends Omit<React.ComponentProps<'button'>, 'children'> {
  icon: React.ReactNode;
  label: string;
  trailing?: React.ReactNode;
  active?: boolean;
}

function SidebarRailButton({
  icon,
  label,
  trailing,
  active = false,
  className,
  type = 'button',
  ...props
}: SidebarRailButtonProps): React.JSX.Element {
  return (
    <button
      type={type}
      data-glide-row
      title={label}
      className={cn(
        'sidebar-row press relative mx-2 flex h-8 shrink-0 cursor-pointer items-center rounded-control px-2 text-left outline-none select-none',
        active && 'bg-surface shadow-btn',
        className
      )}
      {...props}
    >
      <span
        className={cn(
          'flex size-5 shrink-0 items-center justify-center',
          active ? 'text-ink' : 'text-ink-3'
        )}
      >
        {icon}
      </span>
      <span
        className={cn(
          'sidebar-copy ml-2 min-w-0 flex-1 truncate text-sm font-medium',
          active ? 'text-ink' : 'text-ink-2'
        )}
      >
        {label}
      </span>
      {trailing && <span className="sidebar-copy ml-2 flex shrink-0 items-center">{trailing}</span>}
    </button>
  );
}

export default SidebarRailButton;
