import { cn } from "@/lib/utils";

const SIZE = {
  md: { track: "h-5 w-[34px]", knob: "size-4", on: 16 },
  sm: { track: "h-4 w-7", knob: "size-3", on: 14 },
} as const;

export function Switch({
  checked,
  onChange,
  label,
  size = "md",
  className,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  const dims = SIZE[size];
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "interactive press relative shrink-0 cursor-pointer rounded-full",
        dims.track,
        checked ? "bg-accent" : "bg-control-off shadow-[inset_0_0_0_1px_var(--line-strong)]",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-0.5 rounded-full shadow-[0_1px_2px_rgb(0_0_0/40%)] transition-[left,background-color] duration-200 ease-out-strong",
          dims.knob,
          checked || size === "md" ? "bg-knob" : "bg-ink-4",
        )}
        style={{ left: checked ? dims.on : 2 }}
      />
    </button>
  );
}
