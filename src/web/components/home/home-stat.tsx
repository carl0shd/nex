import type { CSSProperties, ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

const TILE =
  "rise-in-glass-fade flex min-w-0 flex-col rounded-panel bg-surface-glass px-4 pt-3.5 pb-3.5 text-left shadow-hairline backdrop-blur-[28px] backdrop-saturate-[1.2]";

export function HomeStat({
  label,
  value,
  detail,
  meter,
  onClick,
  style,
  className,
}: {
  label: string;
  value: string;
  detail: ReactNode;
  meter?: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
  className?: string;
}) {
  const body = (
    <>
      <span className="flex items-center justify-between text-xs text-ink-3">
        {label}
        {onClick && (
          <ArrowUpRight
            width={13}
            height={13}
            strokeWidth={2}
            className="opacity-0 transition-opacity duration-150 group-hover/stat:opacity-100"
          />
        )}
      </span>
      <span className="mt-1 text-2xl leading-8 font-semibold tracking-[-0.01em] text-ink tabular-nums">
        {value}
      </span>
      {meter && <span className="mt-2 flex">{meter}</span>}
      <span className="mt-auto truncate pt-1.5 text-xs text-ink-3">{detail}</span>
    </>
  );
  if (!onClick) {
    return (
      <div style={style} className={cn(TILE, className)}>
        {body}
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      className={cn(
        TILE,
        "group/stat interactive press-large cursor-pointer select-none hover:bg-surface-glass-hover",
        className,
      )}
    >
      {body}
    </button>
  );
}
