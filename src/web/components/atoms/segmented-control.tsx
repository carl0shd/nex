import type { ComponentType } from "react";
import { cn } from "@/lib/utils";
import { useSlidingThumb } from "@/hooks/use-sliding-thumb";

type Icon = ComponentType<{ width?: number; height?: number; strokeWidth?: number }>;

const VARIANT = {
  pill: {
    track: "inline-flex rounded-full bg-elevated",
    thumb: "rounded-full bg-surface-raised shadow-tab",
  },
  bar: {
    track:
      "flex w-full rounded-[9px] bg-canvas shadow-[inset_0_1px_2px_rgb(0_0_0/35%)] [&>[data-thumb-item]]:flex-1",
    thumb: "rounded-[7px] bg-control-off shadow-tab",
  },
} as const;

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  icons,
  labels,
  tones,
  variant = "pill",
  size = "md",
  className = "",
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  icons?: Partial<Record<T, Icon>>;
  labels?: Partial<Record<T, string>>;
  tones?: Partial<Record<T, string>>;
  variant?: keyof typeof VARIANT;
  size?: "sm" | "md";
  className?: string;
}) {
  const { containerRef, thumbRef } = useSlidingThumb<HTMLDivElement, HTMLSpanElement>(
    options.indexOf(value),
  );
  const iconOnly = variant === "bar";
  return (
    <div
      ref={containerRef}
      role="radiogroup"
      className={cn("relative shrink-0 gap-0.5 p-0.5", VARIANT[variant].track, className)}
    >
      <span
        ref={thumbRef}
        aria-hidden
        className={cn("glide-thumb absolute inset-y-0.5 opacity-0", VARIANT[variant].thumb)}
      />
      {options.map((option) => {
        const active = option === value;
        const OptionIcon: Icon | undefined = icons?.[option];
        const label = labels?.[option] ?? option;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={iconOnly ? label : undefined}
            data-thumb-item
            onClick={() => onChange(option)}
            className={cn(
              "interactive press relative flex cursor-pointer items-center gap-1.5 text-xs font-medium whitespace-nowrap select-none",
              iconOnly
                ? "h-[34px] justify-center rounded-[7px]"
                : cn(
                    "rounded-full",
                    size === "sm" && "h-[22px] px-[9px] text-2xs",
                    size === "md" && (OptionIcon ? "h-7 pr-3 pl-2.5" : "h-[26px] px-3"),
                  ),
              active ? "text-ink" : (tones?.[option] ?? "text-ink-3 hover:text-ink-2"),
            )}
          >
            {OptionIcon && (
              <OptionIcon width={iconOnly ? 15 : 13} height={iconOnly ? 15 : 13} strokeWidth={2} />
            )}
            {!iconOnly && label}
          </button>
        );
      })}
    </div>
  );
}
