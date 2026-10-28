import type { ReactNode } from "react";
import { CursorPointer, EditPencil, SquareDashed, Text, Xmark } from "iconoir-react";
import { ClaudeTile } from "@/components/atoms/agent-tile";
import { Button } from "@/components/atoms/button";
import { cn } from "@/lib/utils";

export type ViewportDevice = "desktop" | "phone";

export type ElementBox = { x: number; y: number; width: number; height: number };

export type AnnotateTool = "pick" | "draw" | "box" | "text";

export function BrowserViewport({
  device = "desktop",
  driving = false,
  children,
  overlay,
}: {
  device?: ViewportDevice;
  driving?: boolean;
  children: ReactNode;
  overlay?: ReactNode;
}) {
  return (
    <div className="relative mx-2 mb-2 min-h-0 flex-1 overflow-hidden rounded-field bg-canvas">
      {device === "phone" ? (
        <div className="flex h-full items-start justify-center overflow-hidden px-4 pt-4">
          <div className="relative h-[calc(100%-16px)] w-[390px] max-w-full overflow-hidden rounded-[22px] shadow-raised">
            {children}
          </div>
        </div>
      ) : (
        <div className="relative h-full overflow-hidden">{children}</div>
      )}
      {overlay}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 rounded-field",
          driving
            ? "shadow-[inset_0_0_0_2px_color-mix(in_srgb,var(--green)_75%,transparent)]"
            : "shadow-[inset_0_0_0_1px_var(--line)]",
        )}
      />
    </div>
  );
}

export function ElementHighlight({ box, selector }: { box: ElementBox; selector: string }) {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute z-10 rounded-[9px] bg-blue/12 shadow-[0_0_0_2px_var(--blue)] transition-[left,top,width,height] duration-150 ease-out-strong"
        style={{ left: box.x, top: box.y, width: box.width, height: box.height }}
      />
      <div
        className="pointer-events-none absolute z-10 flex h-[26px] items-center gap-2.5 rounded-[7px] bg-surface-raised px-2.5 font-mono text-2xs whitespace-nowrap shadow-[0_6px_16px_-6px_rgb(0_0_0/50%)]"
        style={{ left: box.x, top: box.y - 32 }}
      >
        <span className="text-blue">{selector}</span>
        <span className="text-ink-3">
          {Math.round(box.width)} × {Math.round(box.height)}
        </span>
      </div>
    </>
  );
}

export function ClaudeCursor({ x, y, action }: { x: number; y: number; action: string }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute z-20 transition-[left,top] duration-500 ease-out-strong"
      style={{ left: x, top: y }}
    >
      <span className="cursor-ripple absolute -top-3.5 -left-3.5 size-7 rounded-full shadow-[0_0_0_2px_color-mix(in_srgb,var(--green)_80%,transparent)]" />
      <svg
        width={20}
        height={20}
        viewBox="0 0 24 24"
        className="relative drop-shadow-[0_2px_3px_rgb(0_0_0/35%)]"
      >
        <path
          d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z"
          className="fill-accent stroke-on-accent"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      </svg>
      <span className="absolute top-4 left-[18px] flex h-[22px] items-center gap-1.5 rounded-full bg-accent pr-2 pl-1 text-2xs font-medium whitespace-nowrap text-on-accent">
        <ClaudeTile size={16} />
        {action}
      </span>
    </div>
  );
}

const TOOLS: { tool: AnnotateTool; label: string; icon: typeof CursorPointer }[] = [
  { tool: "pick", label: "Pick", icon: CursorPointer },
  { tool: "draw", label: "Draw", icon: EditPencil },
  { tool: "box", label: "Box", icon: SquareDashed },
  { tool: "text", label: "Text", icon: Text },
];

export function AnnotateToolbar({
  tool,
  onToolChange,
  onAddToChat,
  onStop,
}: {
  tool: AnnotateTool;
  onToolChange: (tool: AnnotateTool) => void;
  onAddToChat?: () => void;
  onStop?: () => void;
}) {
  return (
    <div
      role="toolbar"
      aria-label="Annotate"
      className="enter-toast absolute bottom-3.5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-0.5 rounded-menu bg-surface-raised p-1 shadow-[0_0_0_1px_var(--line-strong),0_12px_28px_-10px_rgb(0_0_0/60%)]"
    >
      {TOOLS.map(({ tool: value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          aria-label={label}
          aria-pressed={tool === value}
          onClick={() => onToolChange(value)}
          className={cn(
            "interactive press flex size-[30px] cursor-pointer items-center justify-center rounded-control select-none",
            tool === value ? "bg-blue/18 text-blue" : "text-ink-2 hover:bg-hover hover:text-ink",
          )}
        >
          <Icon width={14} height={14} strokeWidth={2} />
        </button>
      ))}
      <span aria-hidden className="mx-1 h-[18px] w-px bg-line-strong" />
      <Button
        variant="primary"
        size="sm"
        className="h-[30px] rounded-control"
        onClick={onAddToChat}
      >
        Add to chat
      </Button>
      <button
        type="button"
        aria-label="Stop picking"
        onClick={onStop}
        className="interactive press flex size-[30px] cursor-pointer items-center justify-center rounded-control text-ink-2 select-none hover:bg-hover hover:text-ink"
      >
        <Xmark width={13} height={13} strokeWidth={2} />
      </button>
    </div>
  );
}
