import { cn } from "@/lib/utils";

type BadgeSize = "sm" | "md" | "lg";

const SIZE: Record<BadgeSize, string> = {
  sm: "size-[18px] rounded-[5px] text-[9px]",
  md: "size-7 rounded-control text-xs",
  lg: "size-[30px] rounded-[9px] text-xs",
};

export function Monogram({
  children,
  color = "var(--accent)",
  image,
  size = "sm",
  className,
}: {
  children: React.ReactNode;
  color?: string;
  image?: string;
  size?: BadgeSize;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden font-semibold text-white",
        SIZE[size],
        className,
      )}
      style={{ background: color }}
    >
      {image ? (
        <img src={image} alt="" draggable={false} className="size-full object-cover" />
      ) : (
        children
      )}
    </span>
  );
}

export function EntityChip({
  name,
  color,
  monogram,
  className,
}: {
  name: string;
  color?: string;
  monogram?: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-2 text-sm font-semibold text-ink", className)}
    >
      <Monogram color={color}>{monogram ?? name[0]}</Monogram>
      {name}
    </span>
  );
}
