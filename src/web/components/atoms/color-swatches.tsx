import { Check } from "iconoir-react";
import { cn } from "@/lib/utils";

export interface Swatch {
  name: string;
  color: string;
}

const WORKSPACE_COLORS: readonly Swatch[] = [
  { name: "Green", color: "#33843F" },
  { name: "Blue", color: "#2f6fd6" },
  { name: "Teal", color: "#0f766e" },
  { name: "Purple", color: "#6b21a8" },
  { name: "Pink", color: "#be185d" },
  { name: "Red", color: "#b91c1c" },
  { name: "Orange", color: "#c2410c" },
  { name: "Amber", color: "#a16207" },
  { name: "Gray", color: "#52544f" },
];

export function ColorSwatches({
  value,
  onChange,
  swatches = WORKSPACE_COLORS,
  shape = "round",
  size = "md",
}: {
  value: string;
  onChange: (color: string) => void;
  swatches?: readonly Swatch[];
  shape?: "round" | "square";
  size?: "sm" | "md";
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Color"
      className={cn("flex flex-wrap", size === "sm" ? "justify-between gap-1" : "gap-2")}
    >
      {swatches.map((swatch) => {
        const selected = swatch.color === value;
        return (
          <button
            key={swatch.color}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={swatch.name}
            onClick={() => onChange(swatch.color)}
            className={cn(
              "interactive press flex cursor-pointer items-center justify-center text-white select-none",
              shape === "square" && "size-[26px] rounded-[7px]",
              shape === "round" && (size === "sm" ? "size-5 rounded-full" : "size-7 rounded-full"),
              selected &&
                shape === "round" &&
                (size === "sm"
                  ? "shadow-[0_0_0_2px_var(--surface-raised),0_0_0_3.5px_var(--ink-3)]"
                  : "shadow-[0_0_0_2px_var(--page),0_0_0_4px_var(--ink-3)]"),
            )}
            style={{ background: swatch.color }}
          >
            {selected && shape === "square" && <Check width={13} height={13} strokeWidth={3} />}
          </button>
        );
      })}
    </div>
  );
}
