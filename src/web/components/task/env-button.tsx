import { Globe } from "lucide-react";
import { Orbit } from "@/components/atoms/orbit";
import { cn } from "@/lib/utils";

export type EnvState = "running" | "starting" | "paused" | "down" | "waiting";

const DOT: Record<Exclude<EnvState, "starting">, string> = {
  running: "bg-green",
  paused: "bg-ink-5",
  down: "bg-red",
  waiting: "bg-orange",
};

export function EnvButton({
  state,
  label,
  open = false,
  onClick,
}: {
  state: EnvState;
  label: string;
  open?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "interactive press relative flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink-2 select-none",
        open
          ? "bg-hover-2 shadow-[inset_0_0_0_1px_var(--line-focus)]"
          : "shadow-[inset_0_0_0_1px_var(--line-chip)] hover:bg-hover",
      )}
    >
      {state === "starting" ? (
        <Orbit size="sm" />
      ) : (
        <>
          <Globe width={14} height={14} strokeWidth={2} />
          <span
            className={cn(
              "absolute top-px right-px size-[7px] rounded-full shadow-[0_0_0_2px_var(--surface)]",
              DOT[state],
            )}
          />
        </>
      )}
    </button>
  );
}
