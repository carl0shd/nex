import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const BOX = "flex size-4 shrink-0 items-center justify-center rounded-[4px]";
const boxState = (checked: boolean) =>
  checked ? "bg-accent text-on-accent" : "shadow-[inset_0_0_0_1.5px_var(--ring-idle)]";

export function Checkbox({
  checked,
  onChange,
  label,
  display = false,
  className,
}: {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  display?: boolean;
  className?: string;
}) {
  const mark = checked && <Check width={10} height={10} strokeWidth={3.5} />;
  if (display) {
    return (
      <span aria-hidden className={cn(BOX, "interactive", boxState(checked), className)}>
        {mark}
      </span>
    );
  }
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange?.(!checked)}
      className={cn(
        BOX,
        "interactive press cursor-pointer select-none",
        boxState(checked),
        !checked && "hover:shadow-[inset_0_0_0_1.5px_var(--ink-4)]",
        className,
      )}
    >
      {mark}
    </button>
  );
}
