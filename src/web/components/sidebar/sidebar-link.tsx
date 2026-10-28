import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

type LinkIcon = ComponentType<{
  width?: number;
  height?: number;
  strokeWidth?: number;
  className?: string;
}>;

export function SidebarLink({
  icon: Icon,
  label,
  trailing,
  active = false,
  accentIcon = false,
  onClick,
}: {
  icon: LinkIcon;
  label: string;
  trailing?: ReactNode;
  active?: boolean;
  accentIcon?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-menu-row
      className={cn(
        "interactive press-wide relative flex h-8 w-full cursor-pointer items-center gap-2 rounded-control px-2 text-sm font-medium select-none",
        active ? "bg-surface text-ink shadow-tab" : "text-ink-2",
      )}
    >
      <Icon
        width={15}
        height={15}
        strokeWidth={2}
        className={accentIcon ? "text-accent-ink" : undefined}
      />
      <span className="flex-1 text-left">{label}</span>
      {trailing}
    </button>
  );
}
