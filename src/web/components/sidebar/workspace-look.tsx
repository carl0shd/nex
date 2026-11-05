import { useRef, type ReactNode } from "react";
import { ColorSwatches } from "@/components/atoms/color-swatches";
import { SegmentedControl } from "@/components/atoms/segmented-control";
import { cn } from "@/lib/utils";
import { readBadgeImage } from "@/lib/workspace-image";

type BadgeKind = "initial" | "image";

export function WorkspaceLook({
  color,
  hasImage,
  onColorChange,
  onImageChange,
  footer,
  className,
}: {
  color: string;
  hasImage: boolean;
  onColorChange: (color: string) => void;
  onImageChange: (image: string | null) => void;
  footer?: ReactNode;
  className?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
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
      <SegmentedControl<BadgeKind>
        options={["initial", "image"]}
        labels={{ initial: "Initial", image: "Image" }}
        value={hasImage ? "image" : "initial"}
        onChange={(kind) => (kind === "image" ? fileRef.current?.click() : onImageChange(null))}
        size="sm"
        className="flex [&>[data-thumb-item]]:flex-1 [&>[data-thumb-item]]:justify-center"
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onImageChange(await readBadgeImage(file));
        }}
      />
      {footer && (
        <span className="flex gap-3 border-t border-line pt-2.5 text-2xs text-ink-4">{footer}</span>
      )}
    </div>
  );
}
