import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FieldPillContent {
  icon?: ReactNode;
  label: string;
  shrink?: boolean;
}

const LONG_LABEL_PX = 180;

function AnimatedLabel({ label, shrink }: { label: string; shrink: boolean }) {
  const naturalRef = useRef<HTMLSpanElement>(null);
  const measured = useRef<number>(undefined);
  const [width, setWidth] = useState<number>();
  const [resizing, setResizing] = useState(false);
  useLayoutEffect(() => {
    // offsetWidth ignores the dialog's entrance scale; +1 covers its rounding of fractional text.
    const natural = naturalRef.current?.offsetWidth;
    const next = natural === undefined ? undefined : natural + 1;
    if (measured.current !== undefined && measured.current !== next) setResizing(true);
    measured.current = next;
    setWidth(next);
  }, [label]);
  return (
    <span
      onTransitionEnd={() => setResizing(false)}
      className={cn(
        "relative flex overflow-hidden transition-[width] duration-200 ease-out-strong",
        shrink ? "min-w-0 shrink" : "shrink-0",
      )}
      style={{ width, maxWidth: shrink ? undefined : LONG_LABEL_PX }}
    >
      <span ref={naturalRef} aria-hidden className="invisible absolute left-0 w-max">
        {label}
      </span>
      <span className={cn("min-w-0", resizing ? "overflow-hidden" : "truncate")}>{label}</span>
    </span>
  );
}

export function FieldPill({
  icon,
  label,
  open = false,
  shrink = false,
  animate = true,
  disabled = false,
  onClick,
}: FieldPillContent & {
  open?: boolean;
  disabled?: boolean;
  animate?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-expanded={open}
      disabled={disabled}
      title={shrink ? label : undefined}
      onClick={onClick}
      className={cn(
        "interactive press flex h-7 cursor-pointer items-center gap-[7px] rounded-full pr-[9px] pl-[7px] text-xs font-medium whitespace-nowrap select-none",
        shrink ? "max-w-[260px] min-w-0 shrink" : "shrink-0",
        open
          ? "bg-hover-2 text-ink shadow-[inset_0_0_0_1px_var(--line-focus)]"
          : "bg-field text-ink-2 hover:bg-hover hover:text-ink",
        "disabled:pointer-events-none disabled:opacity-50",
      )}
    >
      {icon && <span className="flex shrink-0">{icon}</span>}
      {animate ? (
        <AnimatedLabel label={label} shrink={shrink} />
      ) : (
        <span className="truncate">{label}</span>
      )}
      <ChevronDown width={10} height={10} strokeWidth={2.5} className="shrink-0 text-ink-4" />
    </button>
  );
}
