import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Expand({
  open,
  children,
  className,
}: {
  open: boolean;
  children: ReactNode;
  className?: string;
}) {
  const [opened, setOpened] = useState(open);
  if (open && !opened) setOpened(true);
  return (
    <div
      aria-hidden={!open}
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-250 ease-out-strong",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        className,
      )}
    >
      <div className="min-h-0 overflow-hidden">{opened && children}</div>
    </div>
  );
}
