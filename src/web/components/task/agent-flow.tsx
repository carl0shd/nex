import { useState, type ReactNode } from "react";
import { Check, Clock, Copy, NavArrowRight } from "iconoir-react";
import { Orbit } from "@/components/atoms/orbit";
import { Shimmer } from "@/components/atoms/shimmer";
import { cn } from "@/lib/utils";

export function ThinkingLine({ seconds }: { seconds: number }) {
  return (
    <div className="flex h-6 items-center gap-[9px]">
      <span className="flex size-[18px] shrink-0 items-center justify-center">
        <Orbit size="md" />
      </span>
      <Shimmer className="text-sm font-medium">Thinking</Shimmer>
      <span className="text-xs text-ink-4 tabular-nums">{seconds}s</span>
      <span className="ml-auto text-2xs text-ink-4">esc to interrupt</span>
    </div>
  );
}

export function ThoughtToggle({
  seconds,
  open = false,
  onToggle,
}: {
  seconds: number;
  open?: boolean;
  onToggle?: () => void;
}) {
  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={onToggle}
      className="interactive press flex h-6 cursor-pointer items-center gap-1.5 self-start text-xs text-ink-4 select-none hover:text-ink-3"
    >
      Thought for {seconds}s
      <NavArrowRight
        width={11}
        height={11}
        strokeWidth={2}
        className={cn("transition-[rotate] duration-200 ease-out-strong", open && "rotate-90")}
      />
    </button>
  );
}

export function StreamingParagraph({ children }: { children: ReactNode }) {
  return (
    <p className="m-0 text-sm text-ink-2">
      {children}
      <span
        aria-hidden
        className="caret-blink ml-0.5 inline-block h-3.5 w-[7px] translate-y-0.5 rounded-[1px] bg-ink-2"
      />
    </p>
  );
}

function TextAction({
  children,
  strong = false,
  onClick,
}: {
  children: ReactNode;
  strong?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "interactive press h-5 cursor-pointer text-2xs font-medium select-none",
        strong ? "text-ink hover:text-ink-2" : "text-ink-3 hover:text-ink-2",
      )}
    >
      {children}
    </button>
  );
}

export function QueuedMessage({ children }: { children: ReactNode }) {
  return (
    <div className="mt-1.5 flex flex-col items-end gap-2 self-end">
      <div className="max-w-[420px] rounded-[16px_16px_4px_16px] px-3.5 py-2.5 text-sm leading-[19px] text-ink-3 shadow-[inset_0_0_0_1px_var(--line-strong)]">
        {children}
      </div>
      <div className="flex items-center gap-2.5 pr-1 text-2xs text-ink-4">
        <span className="flex items-center gap-[5px]">
          <Clock width={11} height={11} strokeWidth={2} />
          Queued
        </span>
        <span className="text-ink-6">·</span>
        <TextAction strong>Send now</TextAction>
        <span className="text-ink-6">·</span>
        <TextAction>Edit</TextAction>
        <span className="text-ink-6">·</span>
        <TextAction>Cancel</TextAction>
      </div>
    </div>
  );
}

export function ResponseActions({
  time,
  exact,
  visible = false,
}: {
  time: string;
  exact: string;
  visible?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div
      className={cn(
        "-mt-1.5 -ml-1.5 flex h-7 items-center gap-1.5 transition-opacity duration-150",
        visible || copied ? "opacity-100" : "opacity-0 group-hover/response:opacity-100",
      )}
    >
      <button
        type="button"
        aria-label={copied ? "Copied" : "Copy response"}
        title={copied ? undefined : "Copy"}
        onClick={() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className={cn(
          "interactive press flex h-[26px] min-w-[26px] cursor-pointer items-center justify-center gap-[5px] rounded-[7px] select-none",
          copied
            ? "bg-hover px-2 text-2xs font-medium text-accent-ink"
            : "text-ink-4 hover:bg-hover hover:text-ink-2",
        )}
      >
        {copied ? (
          <>
            <Check width={12} height={12} strokeWidth={2.5} />
            Copied
          </>
        ) : (
          <Copy width={14} height={14} strokeWidth={2} />
        )}
      </button>
      <span title={exact} className="text-2xs text-ink-4 tabular-nums">
        {time}
      </span>
    </div>
  );
}

const SEGMENTS = 20;

export function ContextMeter({ percent, compactAt = 95 }: { percent: number; compactAt?: number }) {
  const filled = Math.round((percent / 100) * SEGMENTS);
  const warnFrom = Math.round(SEGMENTS * 0.7);
  return (
    <div className="flex flex-col gap-2 px-0.5 pt-0.5 pb-1">
      <div className="flex items-center gap-2 text-xs text-ink-3">
        <span className="font-medium text-orange tabular-nums">{percent}%</span>
        of context used · Claude compacts at {compactAt}%
        <button
          type="button"
          className="interactive press ml-auto h-5 cursor-pointer text-xs font-medium whitespace-nowrap text-ink select-none hover:text-ink-2"
        >
          Compact now
        </button>
      </div>
      <div className="flex gap-0.5">
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-1 flex-1 rounded-[1px]",
              i >= filled ? "bg-line-chip" : i >= warnFrom ? "bg-orange" : "bg-green",
            )}
          />
        ))}
      </div>
    </div>
  );
}
