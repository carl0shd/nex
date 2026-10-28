import { cn } from "@/lib/utils";

const GEOMETRY = {
  sm: { box: 12, dot: 3, offsets: ["0 -4px", "3.46px 2px", "-3.46px 2px"] },
  md: { box: 16, dot: 4, offsets: ["0 -5px", "4.33px 2.5px", "-4.33px 2.5px"] },
  lg: { box: 32, dot: 8, offsets: ["0 -10px", "8.66px 5px", "-8.66px 5px"] },
};

export function Orbit({
  size = "sm",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { box, dot, offsets } = GEOMETRY[size];
  return (
    <span
      aria-hidden
      className={cn("orbit shrink-0", className)}
      style={{ width: box, height: box }}
    >
      {offsets.map((translate) => (
        <span key={translate} style={{ width: dot, height: dot, margin: -dot / 2, translate }} />
      ))}
    </span>
  );
}
