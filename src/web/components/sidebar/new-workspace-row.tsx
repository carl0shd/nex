import { useRef, useState, type KeyboardEvent } from "react";
import { ColorSwatches } from "@/components/atoms/color-swatches";
import { Monogram } from "@/components/atoms/entity-chip";
import { Kbd } from "@/components/atoms/kbd";
import { SegmentedControl } from "@/components/atoms/segmented-control";
import { useDismiss } from "@/hooks/use-dismiss";

export type WorkspaceBadgeKind = "initial" | "icon" | "image";

export interface NewWorkspace {
  name: string;
  color: string;
  badge: WorkspaceBadgeKind;
}

const DEFAULT_COLOR = "#2f6fd6";

export function NewWorkspaceRow({
  onCreate,
  onCancel,
}: {
  onCreate: (workspace: NewWorkspace) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [badge, setBadge] = useState<WorkspaceBadgeKind>("initial");
  const [lookOpen, setLookOpen] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useDismiss(rootRef, true, onCancel);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter" && name.trim()) {
      event.preventDefault();
      onCreate({ name: name.trim(), color, badge });
    } else if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
    } else if (event.key === "Tab") {
      event.preventDefault();
      setLookOpen((open) => !open);
    }
  };

  return (
    <div ref={rootRef} className="relative mt-0.5" onKeyDown={onKeyDown}>
      <div className="flex h-[34px] items-center gap-2 rounded-control bg-hover pr-1.5 pl-2 shadow-[0_0_0_1px_var(--green),0_0_0_3px_var(--accent-tint)]">
        <button
          type="button"
          aria-label="Color and badge"
          aria-expanded={lookOpen}
          onClick={() => {
            setLookOpen((open) => !open);
            inputRef.current?.focus();
          }}
          className="interactive press flex cursor-pointer select-none"
        >
          <Monogram color={color}>{name.trim()[0]?.toUpperCase() ?? "W"}</Monogram>
        </button>
        <input
          ref={inputRef}
          autoFocus
          aria-label="Workspace name"
          value={name}
          placeholder="Workspace name"
          onChange={(event) => setName(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-ink outline-none select-text placeholder:font-normal placeholder:text-ink-4"
        />
        <Kbd>↵</Kbd>
      </div>
      {lookOpen && (
        <div
          role="dialog"
          aria-label="Workspace look"
          className="enter-pop absolute top-full left-0 z-20 mt-2 flex w-[244px] flex-col gap-3 rounded-menu bg-surface-raised p-3 shadow-overlay"
          style={{ transformOrigin: "top left" }}
        >
          <span className="text-xs text-ink-3">Color</span>
          <ColorSwatches value={color} onChange={setColor} size="sm" />
          <span className="text-xs text-ink-3">Badge</span>
          <SegmentedControl
            options={["initial", "icon", "image"] as const}
            labels={{ initial: "Initial", icon: "Icon", image: "Image" }}
            value={badge}
            onChange={setBadge}
            size="sm"
            className="flex [&>[data-thumb-item]]:flex-1 [&>[data-thumb-item]]:justify-center"
          />
          <span className="flex gap-3 border-t border-line pt-2.5 text-2xs text-ink-4">
            <span>↵ create</span>
            <span>tab look</span>
            <span>esc cancel</span>
          </span>
        </div>
      )}
    </div>
  );
}
