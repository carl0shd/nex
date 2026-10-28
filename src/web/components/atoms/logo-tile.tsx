import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const SIZE = {
  xs: "size-3.5 rounded-[4px] text-[8px]",
  sm: "size-[18px] rounded-[5px] text-3xs",
  md: "size-5 rounded-chip text-3xs",
} as const;

export function LogoTile({
  children,
  color,
  ink,
  size = "sm",
  className,
}: {
  children: ReactNode;
  color?: string;
  ink?: string;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center bg-control-off font-semibold text-ink-2",
        SIZE[size],
        className,
      )}
      style={color ? { background: color, color: ink ?? "#fff" } : undefined}
    >
      {children}
    </span>
  );
}
