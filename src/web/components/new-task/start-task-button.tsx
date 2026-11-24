import { ArrowUp } from "lucide-react";
import { Spinner } from "@/components/atoms/spinner";
import { cn } from "@/lib/utils";

export function StartTaskButton({
  ready,
  starting = false,
  type = "button",
  onClick,
  className,
}: {
  ready: boolean;
  starting?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type={type}
      aria-label={starting ? "Starting task" : "Start task"}
      disabled={!ready}
      onClick={onClick}
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full select-none",
        ready
          ? "interactive press cursor-pointer bg-accent text-on-accent hover:bg-accent-hover"
          : "bg-hover text-ink-4",
        className,
      )}
    >
      {starting ? (
        <Spinner className="size-3.5" />
      ) : (
        <ArrowUp width={15} height={15} strokeWidth={2.5} />
      )}
    </button>
  );
}
