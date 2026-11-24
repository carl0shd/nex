import { useEffect, useMemo, useRef, useState } from "react";
import { useHotkey } from "@tanstack/react-hotkeys";
import { Cpu, X } from "lucide-react";
import type { AgentTask } from "@native/agents/agent-tasks";
import { IconButton } from "@/components/atoms/icon-button";
import { Overlay } from "@/components/primitives/overlay";
import { AgentConversation } from "@/components/task/agent-conversation";
import { CardButton } from "@/components/task/block-cards";
import { useNow } from "@/hooks/use-now";
import { agentTaskMeta } from "@/lib/agent-task-display";
import { buildConversation } from "@/lib/transcript";

const REFRESH_MS = 2000;

export function SubagentSheetView({
  title,
  task,
  entries,
  cwd,
  branch,
  base,
  onStop,
  onClose,
}: {
  title: string;
  task?: AgentTask;
  entries: readonly unknown[];
  cwd: string;
  branch: string;
  base: string;
  onStop?: () => void;
  onClose: () => void;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const running = task?.status === "running";
  const now = useNow(running ? 1000 : 60_000);
  const items = useMemo(() => buildConversation(entries), [entries]);
  useHotkey("Escape", onClose, { target: sheetRef });
  useEffect(() => sheetRef.current?.focus(), []);

  return (
    <Overlay fullWindow onClose={onClose}>
      <div
        ref={sheetRef}
        role="dialog"
        aria-label={title}
        tabIndex={-1}
        className="enter-pop relative flex h-[80vh] w-[760px] max-w-[calc(100vw-48px)] flex-col overflow-hidden rounded-sheet bg-surface shadow-modal outline-none"
      >
        <header className="flex h-12 shrink-0 items-center gap-2.5 border-b border-line px-4">
          <Cpu width={14} height={14} strokeWidth={2} className="shrink-0 text-ink-3" />
          <span className="truncate text-sm font-medium text-ink" title={title}>
            {title}
          </span>
          {task && (
            <span className="shrink-0 text-2xs text-ink-4 tabular-nums">
              {agentTaskMeta(task, now)}
            </span>
          )}
          <span className="ml-auto flex items-center gap-1.5">
            {running && onStop && (
              <CardButton kind="quiet" size="sm" onClick={onStop}>
                Stop
              </CardButton>
            )}
            <IconButton size="sm" aria-label="Close" onClick={onClose}>
              <X width={14} height={14} strokeWidth={2} />
            </IconButton>
          </span>
        </header>
        {items.length === 0 ? (
          <p className="m-auto text-sm text-ink-3">
            {running ? "Starting…" : "Nothing recorded for this agent"}
          </p>
        ) : (
          <AgentConversation
            items={items}
            cwd={cwd}
            branch={branch}
            base={base}
            working={running}
            thinkingSeconds={0}
            thinkingTokens={0}
            liveBlocks={[]}
            className="min-h-0 flex-1"
          />
        )}
      </div>
    </Overlay>
  );
}

export function SubagentSheet({
  terminalId,
  toolUseId,
  ...view
}: Omit<Parameters<typeof SubagentSheetView>[0], "entries"> & {
  terminalId: string;
  toolUseId: string;
}) {
  const [entries, setEntries] = useState<readonly unknown[]>([]);
  const running = view.task?.status === "running";
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      void window.api.readSubagentTranscript(terminalId, toolUseId).then((next) => {
        if (!cancelled) setEntries(next);
      });
    load();
    const timer = running ? window.setInterval(load, REFRESH_MS) : undefined;
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [terminalId, toolUseId, running]);
  return <SubagentSheetView {...view} entries={entries} />;
}
