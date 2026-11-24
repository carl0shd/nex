import { cn } from "@/lib/utils";

export function Slider({
  value,
  min,
  max,
  step = 1,
  label,
  onChange,
  className,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  label: string;
  onChange: (value: number) => void;
  className?: string;
}) {
  return (
    <input
      type="range"
      aria-label={label}
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(event) => onChange(Number(event.target.value))}
      className={cn("slider min-w-0 cursor-pointer select-none", className)}
    />
  );
}
