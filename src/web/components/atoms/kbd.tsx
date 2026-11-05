import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const NUDGED_GLYPHS: Record<string, string> = { "↵": "top-px", "@": "-top-px" };
const NUDGED = /([↵@])/;

export function KeyText({ children }: { children: ReactNode }) {
  if (typeof children !== "string" || !NUDGED.test(children)) return children;
  return children.split(NUDGED).map((part, index) =>
    NUDGED_GLYPHS[part] ? (
      <span key={index} className={cn("relative", NUDGED_GLYPHS[part])}>
        {part}
      </span>
    ) : (
      part
    ),
  );
}

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "rounded-[5px] bg-elevated px-[5px] py-0.5 font-sans text-3xs leading-3 text-ink-3 shadow-[inset_0_0_0_1px_var(--line-strong)]",
        className,
      )}
    >
      <KeyText>{children}</KeyText>
    </kbd>
  );
}

export function KeyCaps({ keys, className }: { keys: string[]; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {keys.map((key) => (
        <kbd
          key={key}
          className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-chip bg-elevated px-1.5 font-sans text-2xs font-medium text-ink-2 shadow-[inset_0_0_0_1px_var(--line-strong)]"
        >
          <KeyText>{key}</KeyText>
        </kbd>
      ))}
    </span>
  );
}
