import { useRef } from "react";
import { Expand } from "@/components/atoms/expand";
import { IconPicker } from "@/components/atoms/icon-picker";
import { SegmentedControl } from "@/components/atoms/segmented-control";
import { cn } from "@/lib/utils";
import { readBadgeImage } from "@/lib/workspace-image";
import {
  WORKSPACE_ICON_NAMES,
  WORKSPACE_ICONS,
  type WorkspaceBadge,
  type WorkspaceIconName,
} from "@/lib/workspace-icons";

type BadgeKind = "initial" | "icon" | "image";

export function WorkspaceBadgePicker({
  hasImage,
  icon,
  onChange,
  size = "md",
  className,
}: {
  hasImage: boolean;
  icon?: WorkspaceIconName | null;
  onChange: (badge: WorkspaceBadge) => void;
  size?: "sm" | "md";
  className?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const kind: BadgeKind = hasImage ? "image" : icon ? "icon" : "initial";
  const choose = (next: BadgeKind) => {
    if (next === "image") fileRef.current?.click();
    if (next === "icon") onChange({ image: null, icon: icon ?? WORKSPACE_ICON_NAMES[0] });
    if (next === "initial") onChange({ image: null, icon: null });
  };

  return (
    <div className={cn("flex flex-col", className)}>
      <SegmentedControl<BadgeKind>
        options={["initial", "icon", "image"]}
        labels={{ initial: "Initial", icon: "Icon", image: "Image" }}
        value={kind}
        onChange={choose}
        size={size}
        className={
          size === "sm"
            ? "flex [&>[data-thumb-item]]:flex-1 [&>[data-thumb-item]]:justify-center"
            : "self-start"
        }
      />
      <Expand open={kind === "icon"}>
        <IconPicker
          icons={WORKSPACE_ICONS}
          value={icon ?? null}
          onChange={(next) => onChange({ image: null, icon: next })}
          size={size}
          className={size === "sm" ? "pt-2.5" : "pt-3"}
        />
      </Expand>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onChange({ image: await readBadgeImage(file), icon: null });
        }}
      />
    </div>
  );
}
