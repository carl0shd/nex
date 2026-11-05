import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function HoverSwap({
  rest,
  hover,
  pinned = false,
  className,
}: {
  rest: ReactNode;
  hover: ReactNode;
  pinned?: boolean;
  className?: string;
}) {
  return (
    <span data-pinned={pinned || undefined} className={cn("hover-swap shrink-0", className)}>
      <span data-swap="rest" className="flex">
        {rest}
      </span>
      <span data-swap="hover" className="flex">
        {hover}
      </span>
    </span>
  );
}
