import { Button } from "@/components/atoms/button";
import { AgentStrip } from "@/components/home/agent-strip";
import { StripGlyph } from "@/components/home/strip-glyph";
import { shortcutLabel } from "@/lib/app-shortcuts";

export function TasksEmpty({
  onNewTask,
  onOverview,
}: {
  onNewTask?: () => void;
  onOverview?: () => void;
}) {
  return (
    <AgentStrip
      items={[]}
      summary={<span className="text-xs text-ink-3">No tasks yet</span>}
      trailing={<EmptyCard onNewTask={onNewTask} onOverview={onOverview} />}
    />
  );
}

function EmptyCard({ onNewTask, onOverview }: { onNewTask?: () => void; onOverview?: () => void }) {
  return (
    <div className="rise-in-glass-fade flex h-full w-[600px] shrink-0 flex-col items-center justify-center rounded-panel bg-surface-glass px-10 text-center shadow-card backdrop-blur-[28px] backdrop-saturate-[1.2]">
      <StripGlyph />
      <h2 className="m-0 mt-8 text-lg font-semibold tracking-[-0.01em] text-ink">
        Your tasks run here, side by side
      </h2>
      <p className="m-0 mt-2 max-w-[360px] text-sm text-ink-3">
        Each one works in its own worktree, so you can keep several going and jump between them.
      </p>
      <div className="mt-6 flex items-center gap-2">
        <Button variant="primary" size="sm" kbd={shortcutLabel("new-task")} onClick={onNewTask}>
          New task
        </Button>
        <Button variant="quiet" size="sm" onClick={onOverview}>
          Overview
        </Button>
      </div>
    </div>
  );
}
