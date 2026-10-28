import { Check } from "iconoir-react";
import { cn } from "@/lib/utils";

export function Checkbox({
  checked,
  onChange,
  label,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "interactive press flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-[4px] select-none",
        checked
          ? "bg-accent text-on-accent"
          : "shadow-[inset_0_0_0_1.5px_var(--ring-idle)] hover:shadow-[inset_0_0_0_1.5px_var(--ink-4)]",
        className,
      )}
    >
      {checked && <Check width={10} height={10} strokeWidth={3.5} />}
    </button>
  );
}
