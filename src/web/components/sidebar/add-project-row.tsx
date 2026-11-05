import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function AddProjectRow({
  onClick,
  onDropFolder,
}: {
  onClick?: () => void;
  onDropFolder?: (file: File) => void;
}) {
  const [over, setOver] = useState(false);
  return (
    <div className="ml-[22px] border-l border-line-tree pt-0.5 pl-2">
      <button
        type="button"
        onClick={onClick}
        onDragOver={(event) => {
          if (!onDropFolder) return;
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setOver(false);
          const file = event.dataTransfer.files[0];
          if (file) onDropFolder?.(file);
        }}
        className={cn(
          "interactive press-wide flex h-[30px] w-full cursor-pointer items-center gap-2 rounded-control px-2 text-xs font-medium select-none",
          over
            ? "bg-accent-tint text-ink shadow-[inset_0_0_0_1px_var(--accent-ink)]"
            : "bg-hover text-ink-2 shadow-[inset_0_0_0_1px_var(--line-strong)] hover:bg-hover-2 hover:text-ink",
        )}
      >
        <Plus width={12} height={12} strokeWidth={2.25} />
        Add a project
        <span className="ml-auto text-3xs font-normal text-ink-4">or drop a folder</span>
      </button>
    </div>
  );
}
