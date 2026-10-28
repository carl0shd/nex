import type { ReactNode } from "react";
import { Check, Minus, Xmark } from "iconoir-react";
import { Orbit } from "@/components/atoms/orbit";
import { cn } from "@/lib/utils";

export type CheckState = "done" | "running" | "pending" | "failed" | "skipped";

export interface CheckItem {
  label: string;
  detail?: string;
  state: CheckState;
  trailing?: ReactNode;
}

function CheckMark({ state }: { state: CheckState }) {
  if (state === "running") return <Orbit size="sm" className="mx-[3px]" />;
  if (state === "pending")
    return (
      <span className="flex size-[18px] items-center justify-center">
        <span className="size-1.5 rounded-full bg-ink-5" />
      </span>
    );
  const Icon = state === "done" ? Check : state === "failed" ? Xmark : Minus;
  return (
    <span
      className={cn(
        "flex size-[18px] shrink-0 items-center justify-center rounded-full",
        state === "done" && "bg-green-tint text-green",
        state === "failed" && "bg-red-tint text-red",
        state === "skipped" && "bg-hover text-ink-3",
      )}
    >
      <Icon width={10} height={10} strokeWidth={3.5} />
    </span>
  );
}

export function CheckList({
  items,
  mono = false,
  className,
}: {
  items: readonly CheckItem[];
  mono?: boolean;
  className?: string;
}) {
  return (
    <ul className={cn("m-0 flex list-none flex-col gap-1 p-0", className)}>
      {items.map((item) => (
        <li key={item.label} className="flex items-start gap-3 py-1.5">
          <span className="flex h-[18px] items-center">
            <CheckMark state={item.state} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-px">
            <span
              className={cn(
                "text-sm leading-[18px]",
                item.state === "pending" ? "text-ink-4" : "text-ink",
              )}
            >
              {item.label}
            </span>
            {item.detail && (
              <span className={cn("text-xs text-ink-3", mono && "font-mono text-2xs text-ink-4")}>
                {item.detail}
              </span>
            )}
          </span>
          {item.trailing}
        </li>
      ))}
    </ul>
  );
}
