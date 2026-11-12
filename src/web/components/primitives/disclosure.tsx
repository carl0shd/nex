import { useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Expand } from "@/components/atoms/expand";
import { cn } from "@/lib/utils";

export function Disclosure({
  label,
  summary,
  leading,
  defaultOpen = false,
  align = "text",
  children,
  className,
}: {
  label: string;
  summary?: string;
  leading?: ReactNode;
  defaultOpen?: boolean;
  align?: "text" | "cards";
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn("flex min-w-0 flex-col", className)}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={cn(
          "interactive press-wide flex h-7 min-w-0 cursor-pointer items-center gap-1.5 text-left select-none hover:bg-hover focus-visible:bg-hover focus-visible:outline-none",
          align === "cards" ? "rounded-field px-3" : "-mx-1.5 rounded-control px-1.5",
        )}
      >
        <ChevronRight
          width={12}
          height={12}
          strokeWidth={2.25}
          className={cn(
            "shrink-0 text-ink-4 transition-transform duration-200 ease-out",
            open && "rotate-90",
          )}
        />
        {leading}
        <span className="shrink-0 text-xs text-ink-2">{label}</span>
        {summary && (
          <span title={summary} className="min-w-0 truncate text-2xs text-ink-4">
            {summary}
          </span>
        )}
      </button>
      <Expand open={open}>{children}</Expand>
    </div>
  );
}
