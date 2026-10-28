import type { ReactNode } from "react";
import { NavArrowDown } from "iconoir-react";
import { cn } from "@/lib/utils";

export function FieldPill({
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
      aria-expanded={open}
      onClick={onClick}
      className={cn(
        "interactive press flex h-7 shrink-0 cursor-pointer items-center gap-[7px] rounded-full pr-[9px] pl-[7px] text-xs font-medium whitespace-nowrap select-none",
        open
          ? "bg-hover-2 text-ink shadow-[inset_0_0_0_1px_var(--line-focus)]"
          : "bg-field text-ink-2 hover:bg-hover hover:text-ink",
      )}
    >
      {children}
      <NavArrowDown width={10} height={10} strokeWidth={2.5} className="text-ink-4" />
    </button>
  );
}
