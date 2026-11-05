import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { Monogram } from "@/components/atoms/entity-chip";
import { Kbd, KeyText } from "@/components/atoms/kbd";
import { WorkspaceLook } from "@/components/sidebar/workspace-look";
import { useDismiss } from "@/hooks/use-dismiss";
import { cn } from "@/lib/utils";

export interface NewWorkspace {
  name: string;
  color: string;
  image: string | null;
}

const DEFAULT_COLOR = "#2f6fd6";
const LOOK_ROOM = 220;

export function NewWorkspaceRow({
  onCreate,
  onCancel,
}: {
  onCreate: (workspace: NewWorkspace) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [image, setImage] = useState<string | null>(null);
  const [lookOpen, setLookOpen] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [lookAbove, setLookAbove] = useState(false);
  useDismiss(rootRef, true, onCancel);
  useLayoutEffect(() => {
    const bottom = rootRef.current?.getBoundingClientRect().bottom ?? 0;
    setLookAbove(window.innerHeight - bottom < LOOK_ROOM);
  }, []);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter" && name.trim()) {
      event.preventDefault();
      onCreate({ name: name.trim(), color, image });
    } else if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
    }
  };

  return (
    <div ref={rootRef} className="relative mt-0.5" onKeyDown={onKeyDown}>
      <div className="flex h-[34px] items-center gap-2 rounded-control bg-hover pr-1.5 pl-2 shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_50%,transparent),0_0_0_3px_var(--accent-tint)]">
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
          <Monogram color={color} image={image ?? undefined}>
            {name.trim()[0]?.toUpperCase() ?? "W"}
          </Monogram>
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
        <WorkspaceLook
          color={color}
          hasImage={Boolean(image)}
          onColorChange={setColor}
          onImageChange={(next) => {
            setImage(next);
            inputRef.current?.focus();
          }}
          className={cn("absolute left-0 z-20", lookAbove ? "bottom-full mb-2" : "top-full mt-2")}
          footer={
            <>
              <span>
                <KeyText>↵ create</KeyText>
              </span>
              <span>esc cancel</span>
            </>
          }
        />
      )}
    </div>
  );
}
