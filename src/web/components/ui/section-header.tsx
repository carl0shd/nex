import { ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import IconButton from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";

interface Action {
  icon: LucideIcon;
  label?: string;
  onClick?: () => void;
}

interface SectionHeaderProps {
  title: string;
  collapsed?: boolean;
  onToggle?: () => void;
  actions?: Action[];
  badge?: React.ReactNode;
  className?: string;
}

const EMPTY_ACTIONS: Action[] = [];

function SectionHeader({
  title,
  collapsed = false,
  onToggle,
  actions = EMPTY_ACTIONS,
  badge,
  className,
}: SectionHeaderProps): React.JSX.Element {
  return (
    <div className={cn("group/section flex h-7 w-full items-center gap-1 px-2", className)}>
      <button
        type="button"
        onClick={onToggle}
        disabled={!onToggle}
        className="interactive flex items-center gap-1 outline-none select-none enabled:cursor-pointer"
      >
        <span className="eyebrow interactive group-hover/section:text-ink-2">{title}</span>
        {onToggle && (
          <ChevronDown
            size={11}
            className={cn(
              "text-ink-4 opacity-0 transition-[opacity,rotate] duration-200 ease-out-strong group-hover/section:opacity-100",
              collapsed && "-rotate-90 opacity-100",
            )}
          />
        )}
      </button>
      <div className="flex-1" />
      {actions.map((action, i) => (
        <IconButton
          key={i}
          icon={action.icon}
          size={13}
          title={action.label}
          onClick={action.onClick}
          className="size-6"
        />
      ))}
      {badge}
    </div>
  );
}

export default SectionHeader;
