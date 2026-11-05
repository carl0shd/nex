import { ArrowDown } from "lucide-react";
import { StatusDot } from "@/components/atoms/status-dot";
import { cn } from "@/lib/utils";

export function JumpToLatest({
  newSteps,
  needsYou = false,
  onClick,
  className,
}: {
  newSteps: number;
  needsYou?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const label = needsYou
    ? "Claude needs you"
    : newSteps > 0
      ? `${newSteps} new ${newSteps === 1 ? "step" : "steps"}`
      : "Back to latest";
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "interactive press enter-pop flex h-8 cursor-pointer items-center gap-[7px] rounded-full bg-glass pr-3 pl-2.5 text-xs font-medium text-ink shadow-toast backdrop-blur-[12px] select-none hover:bg-surface-raised",
        className,
      )}
    >
      {(needsYou || newSteps > 0) && <StatusDot tone={needsYou ? "orange" : "green"} />}
      {label}
      <ArrowDown width={13} height={13} strokeWidth={2.25} />
    </button>
  );
}
