import type { ReactNode } from "react";
import { NavArrowDown } from "iconoir-react";
import { cn } from "@/lib/utils";

export function SessionChip({
  open = false,
  onClick,
  children,
}: {
  open?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={onClick}
      className={cn(
        "interactive press-wide flex h-7 shrink-0 cursor-pointer items-center gap-[7px] rounded-full pr-2 pl-2.5 text-2xs font-medium whitespace-nowrap text-ink-2 select-none",
        open
          ? "bg-hover-2 shadow-[inset_0_0_0_1px_var(--line-focus)]"
          : "shadow-[inset_0_0_0_1px_var(--line-chip)] hover:bg-hover",
      )}
    >
      {children}
      <NavArrowDown width={10} height={10} strokeWidth={2.5} className="text-ink-4" />
    </button>
  );
}
