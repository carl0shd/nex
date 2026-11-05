import { Plus } from "lucide-react";
import { Kbd } from "@/components/atoms/kbd";
import { shortcutLabel } from "@/lib/app-shortcuts";

export function AddAgentSlot({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="interactive press-large flex h-full w-[600px] shrink-0 cursor-pointer flex-col items-center justify-center gap-3 rounded-panel border border-dashed border-line-focus text-ink-3 select-none hover:bg-hover/50 hover:text-ink-2"
    >
      <span className="flex size-10 items-center justify-center rounded-menu bg-hover text-ink-2">
        <Plus width={16} height={16} strokeWidth={2.25} />
      </span>
      <span className="text-base font-medium text-ink">Run another agent alongside</span>
      <span className="flex items-center gap-1.5 text-xs">
        Each task works in its own worktree. <Kbd>{shortcutLabel("new-task")}</Kbd>
      </span>
    </button>
  );
}
