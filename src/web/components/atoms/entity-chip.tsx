import { cn } from "@/lib/utils";
import { WORKSPACE_ICONS, type WorkspaceIconName } from "@/lib/workspace-icons";

type BadgeSize = "sm" | "md" | "lg";

const ICON_PX: Record<BadgeSize, number> = { sm: 11, md: 15, lg: 16 };

const SIZE: Record<BadgeSize, string> = {
  sm: "size-[18px] rounded-[5px] text-[9px]",
  md: "size-7 rounded-control text-xs",
  lg: "size-[30px] rounded-[9px] text-xs",
};

export function Monogram({
  children,
  color = "var(--accent)",
  image,
  icon,
  size = "sm",
  className,
}: {
  children: React.ReactNode;
  color?: string;
  image?: string;
  icon?: WorkspaceIconName | null;
  size?: BadgeSize;
  className?: string;
}) {
  const Icon = icon ? WORKSPACE_ICONS[icon] : null;
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
      ) : Icon ? (
        <Icon width={ICON_PX[size]} height={ICON_PX[size]} strokeWidth={2.25} aria-hidden />
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
