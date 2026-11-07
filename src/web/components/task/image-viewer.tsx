import { useState } from "react";
import { useHotkeys } from "@tanstack/react-hotkeys";
import { Check, ChevronLeft, ChevronRight, Copy, X, ZoomIn, ZoomOut } from "lucide-react";
import { IconButton } from "@/components/atoms/icon-button";
import { isClickable } from "@/hooks/use-empty-click";
import { useZoomPan } from "@/hooks/use-zoom-pan";
import { copyImage } from "@/lib/copy-image";
import { cn } from "@/lib/utils";

const ZOOM_STEP = 1.5;

function StepButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="interactive press flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-elevated text-ink-3 select-none hover:text-ink"
    >
      {children}
    </button>
  );
}

export function ImageViewer({
  images,
  names = [],
  index,
  onIndexChange,
  onClose,
}: {
  images: readonly string[];
  names?: readonly (string | undefined)[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const many = images.length > 1;
  const { stageRef, view, smooth, dragging, zoomBy, reset, justDragged } = useZoomPan();
  const show = (next: number) => {
    setSize(null);
    reset();
    onIndexChange(next);
  };
  const go = (delta: number) => show((index + delta + images.length) % images.length);
  useHotkeys([
    { hotkey: "Escape", callback: onClose },
    { hotkey: "ArrowLeft", callback: () => many && go(-1) },
    { hotkey: "ArrowRight", callback: () => many && go(1) },
    { hotkey: "=", callback: () => zoomBy(ZOOM_STEP) },
    { hotkey: "-", callback: () => zoomBy(1 / ZOOM_STEP) },
    { hotkey: "0", callback: reset },
  ]);
  const { scale, x, y } = view;

  return (
    <div
      onClick={(event) => {
        if (view.scale > 1 || justDragged() || isClickable(event.target)) return;
        onClose();
      }}
      className="enter-pop absolute inset-0 z-30 flex flex-col rounded-b-[inherit] bg-backdrop/95"
    >
      <div className="flex h-11 shrink-0 items-center gap-2 pr-2.5 pl-4">
        <span title={names[index]} className="min-w-0 truncate text-xs text-ink">
          {names[index] ?? `Image ${index + 1}`}
        </span>
        <span className="shrink-0 text-xs text-ink-3 tabular-nums">
          {many && `${index + 1} of ${images.length}`}
          {many && size && " · "}
          {size && `${size.width}×${size.height}`}
        </span>
        <span className="ml-auto flex items-center gap-0.5">
          <IconButton
            size="sm"
            aria-label="Zoom out"
            disabled={scale <= 1}
            onClick={() => zoomBy(1 / ZOOM_STEP)}
            className="disabled:pointer-events-none disabled:opacity-40"
          >
            <ZoomOut width={13} height={13} strokeWidth={2} />
          </IconButton>
          <button
            type="button"
            title="Reset zoom"
            onClick={reset}
            className="interactive press h-7 w-11 cursor-pointer rounded-full text-2xs text-ink-3 tabular-nums select-none hover:bg-hover hover:text-ink"
          >
            {Math.round(scale * 100)}%
          </button>
          <IconButton size="sm" aria-label="Zoom in" onClick={() => zoomBy(ZOOM_STEP)}>
            <ZoomIn width={13} height={13} strokeWidth={2} />
          </IconButton>
          <span className="mx-1 h-4 w-px bg-line" />
          <IconButton
            size="sm"
            aria-label={copied ? "Copied" : "Copy image"}
            onClick={() =>
              void copyImage(images[index]).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              })
            }
          >
            {copied ? (
              <Check width={13} height={13} strokeWidth={2.5} className="text-accent-ink" />
            ) : (
              <Copy width={13} height={13} strokeWidth={2} />
            )}
          </IconButton>
          <IconButton size="sm" aria-label="Close" onClick={onClose}>
            <X width={14} height={14} strokeWidth={2} />
          </IconButton>
        </span>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center gap-5 px-6">
        {many && (
          <StepButton label="Previous image" onClick={() => go(-1)}>
            <ChevronLeft width={14} height={14} strokeWidth={2.25} />
          </StepButton>
        )}
        <div
          ref={stageRef}
          className={cn(
            "flex h-full min-w-0 flex-1 items-center justify-center overflow-hidden select-none",
            scale > 1 ? (dragging ? "cursor-grabbing" : "cursor-grab") : "cursor-zoom-in",
          )}
        >
          <span key={index} className="enter-pop flex h-full min-w-0 items-center justify-center">
            <img
              src={images[index]}
              alt=""
              draggable={false}
              onLoad={(event) =>
                setSize({
                  width: event.currentTarget.naturalWidth,
                  height: event.currentTarget.naturalHeight,
                })
              }
              style={{
                transform: `translate(${x}px, ${y}px) scale(${scale})`,
                transition: smooth ? "transform 200ms var(--ease-out-strong)" : "none",
              }}
              className="max-h-full min-w-0 rounded-control object-contain shadow-[0_0_0_1px_var(--line)]"
            />
          </span>
        </div>
        {many && (
          <StepButton label="Next image" onClick={() => go(1)}>
            <ChevronRight width={14} height={14} strokeWidth={2.25} />
          </StepButton>
        )}
      </div>
      {many && (
        <div className="flex h-16 shrink-0 items-center justify-center gap-2">
          {images.map((src, thumb) => (
            <button
              key={thumb}
              type="button"
              aria-label={`Show image ${thumb + 1}`}
              onClick={() => show(thumb)}
              className={cn(
                "interactive press h-10 w-10 cursor-pointer overflow-hidden rounded-control select-none",
                thumb === index
                  ? "shadow-[0_0_0_1.5px_var(--accent-ink)]"
                  : "opacity-55 shadow-[inset_0_0_0_1px_var(--line-strong)] hover:opacity-100",
              )}
            >
              <img src={src} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
      {!many && <div className="h-3 shrink-0" />}
    </div>
  );
}
