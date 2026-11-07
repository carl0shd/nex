import type { ReactNode } from "react";
import { ColorSwatches } from "@/components/atoms/color-swatches";
import { WorkspaceBadgePicker } from "@/components/sidebar/workspace-badge-picker";
import { cn } from "@/lib/utils";
import type { WorkspaceBadge, WorkspaceIconName } from "@/lib/workspace-icons";

export function WorkspaceLook({
  color,
  hasImage,
  icon,
  onColorChange,
  onBadgeChange,
  footer,
  className,
}: {
  color: string;
  hasImage: boolean;
  icon?: WorkspaceIconName | null;
  onColorChange: (color: string) => void;
  onBadgeChange: (badge: WorkspaceBadge) => void;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="dialog"
      aria-label="Workspace look"
      className={cn(
        "enter-pop flex w-[244px] flex-col gap-3 rounded-menu bg-surface-raised p-3 shadow-overlay",
        className,
      )}
    >
      <span className="text-xs text-ink-3">Color</span>
      <ColorSwatches value={color} onChange={onColorChange} size="sm" />
      <span className="text-xs text-ink-3">Badge</span>
      <WorkspaceBadgePicker hasImage={hasImage} icon={icon} onChange={onBadgeChange} size="sm" />
      {footer && (
        <span className="flex gap-3 border-t border-line pt-2.5 text-2xs text-ink-4">{footer}</span>
      )}
    </div>
  );
}
