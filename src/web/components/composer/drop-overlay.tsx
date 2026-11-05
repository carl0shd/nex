import { FileIcon } from "lucide-react";
import { ImageThumb } from "@/components/composer/attachments";

export function DropOverlay({ images, files }: { images: number; files: number }) {
  const total = images + files;
  const parts = [
    images && `${images} image${images === 1 ? "" : "s"}`,
    files && `${files} file${files === 1 ? "" : "s"}`,
  ].filter(Boolean);
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 rounded-[inherit] bg-surface/80 shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--accent)_70%,transparent)]">
      <div className="mb-1.5 flex gap-1.5">
        {Array.from({ length: Math.min(images, 3) }, (_, index) => (
          <ImageThumb key={index} name="" size="drop" />
        ))}
        {files > 0 && images < 3 && (
          <span className="flex size-11 items-center justify-center self-center rounded-field bg-elevated text-ink-2 shadow-[inset_0_0_0_1px_var(--line-strong)]">
            <FileIcon width={14} height={14} strokeWidth={2} />
          </span>
        )}
      </div>
      <span className="text-sm font-medium text-ink">
        Drop to attach {total} file{total === 1 ? "" : "s"}
      </span>
      <span className="text-2xs text-ink-3">
        {parts.join(" and ")} go{total === 1 ? "es" : ""} to this task
      </span>
    </div>
  );
}
