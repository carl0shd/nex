import { GitCompareArrows } from "lucide-react";

export function NoChanges() {
  return (
    <div className="enter-step flex flex-1 flex-col items-center justify-center gap-1.5 text-center">
      <GitCompareArrows width={22} height={22} strokeWidth={1.75} className="mb-1.5 text-ink-4" />
      <span className="text-sm text-ink-3">No changes yet</span>
      <span className="text-xs text-ink-4">What changes in this worktree shows up here.</span>
    </div>
  );
}
