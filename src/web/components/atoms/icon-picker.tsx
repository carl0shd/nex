import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

type PickerIcon = ComponentType<{ width?: number; height?: number; strokeWidth?: number }>;

export function IconPicker<T extends string>({
  icons,
  value,
  onChange,
  size = "md",
  label = "Icon",
  className,
}: {
  icons: Readonly<Record<T, PickerIcon>>;
  value: T | null;
  onChange: (icon: T) => void;
  size?: "sm" | "md";
  label?: string;
  className?: string;
}) {
  const names = Object.keys(icons) as T[];
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("grid grid-cols-8", size === "sm" ? "gap-1" : "gap-1.5", className)}
    >
      {names.map((name) => {
        const Icon: PickerIcon = icons[name];
        const selected = name === value;
        return (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={name}
            title={name}
            onClick={() => onChange(name)}
            className={cn(
              "interactive press flex cursor-pointer items-center justify-center rounded-control select-none",
              size === "sm" ? "size-6" : "size-8",
              selected
                ? "bg-hover-2 text-ink shadow-[inset_0_0_0_1px_var(--line-strong)]"
                : "text-ink-3 hover:bg-hover hover:text-ink",
            )}
          >
            <Icon
              width={size === "sm" ? 13 : 15}
              height={size === "sm" ? 13 : 15}
              strokeWidth={2}
            />
          </button>
        );
      })}
    </div>
  );
}
