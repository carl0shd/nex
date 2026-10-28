import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ComposerPill({
  children,
  active = false,
  onClick,
  label,
  className,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={onClick ? active : undefined}
      onClick={onClick}
      className={cn(
        "interactive press flex h-[26px] shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-2xs whitespace-nowrap text-ink-2 shadow-[0_0_0_1px_var(--line-chip)] select-none hover:bg-hover",
        active && "bg-hover-2 hover:bg-hover-2",
        className,
      )}
    >
      {children}
    </button>
  );
}
