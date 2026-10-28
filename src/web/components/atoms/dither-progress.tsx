import { cn } from "@/lib/utils";

export function DitherProgress({
  value,
  tone = "green",
  className,
}: {
  value: number;
  tone?: "green" | "red";
  className?: string;
}) {
  return (
    <span
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("block h-1.5 overflow-hidden rounded-[2px] bg-hover", className)}
    >
      <span
        className={cn(
          "dither-fill block h-full transition-[width] duration-500 ease-out",
          tone === "green" ? "text-green" : "text-red",
        )}
        style={{ width: `${value}%` }}
      />
    </span>
  );
}
