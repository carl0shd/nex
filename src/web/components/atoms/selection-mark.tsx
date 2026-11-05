import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZE = { sm: { box: "size-[13px]", check: 8 }, md: { box: "size-4", check: 9 } } as const;

type MarkSize = keyof typeof SIZE;

function Mark({ selected, size }: { selected: boolean; size: MarkSize }) {
  if (!selected) {
    return (
      <span
        aria-hidden
        className={cn(
          "interactive rounded-full shadow-[inset_0_0_0_1.5px_var(--ring-idle)]",
          SIZE[size].box,
        )}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "interactive flex items-center justify-center rounded-full bg-accent text-white",
        SIZE[size].box,
      )}
    >
      <Check width={SIZE[size].check} height={SIZE[size].check} strokeWidth={3.5} />
    </span>
  );
}

export function SelectionMark({
  selected,
  onClick,
  label,
  size = "md",
  className,
}: {
  selected: boolean;
  onClick?: () => void;
  label?: string;
  size?: MarkSize;
  className?: string;
}) {
  if (!onClick) {
    return (
      <span className={cn("flex shrink-0", className)}>
        <Mark selected={selected} size={size} />
      </span>
    );
  }
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "interactive press flex shrink-0 cursor-pointer rounded-full select-none",
        className,
      )}
    >
      <Mark selected={selected} size={size} />
    </button>
  );
}
