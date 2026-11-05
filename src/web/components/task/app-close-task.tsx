import { useEffect, useRef, useState } from "react";
import { Overlay } from "@/components/primitives/overlay";
import { CloseTaskDialog } from "@/components/task/close-task-dialog";
import { notifyCompact } from "@/lib/notify";
import { useCloseTaskStore } from "@/stores/close-task.store";
import { usePreferencesStore } from "@/stores/preferences.store";
import { useWorkspaceStore } from "@/stores/workspace.store";

const COMMIT_PROMPT = "Commit all the changes in this worktree with a clear message.";

function CloseTask({ sessionId, onDone }: { sessionId: string; onDone: () => void }) {
  const session = useWorkspaceStore((s) => s.sessions.find((item) => item.id === sessionId));
  const closeTask = useWorkspaceStore((s) => s.closeTask);
  const setAgentRunning = useWorkspaceStore((s) => s.setAgentRunning);
  const [uncommitted, setUncommitted] = useState<number | null>(null);
  const worktreePath = session?.worktreePath;

  useEffect(() => {
    if (!worktreePath) return;
    let cancelled = false;
    void window.api
      .countUncommitted(worktreePath)
      .then((count) => !cancelled && setUncommitted(count));
    return () => {
      cancelled = true;
    };
  }, [worktreePath]);

  const confirmClose = usePreferencesStore((s) => s.prefs.confirmClose);
  const skipDialog = !confirmClose && uncommitted === 0;
  const title = session ? session.title || session.name : "";
  const close = () => {
    onDone();
    void closeTask(sessionId)
      .then(() => notifyCompact({ tone: "neutral", title: `${title} closed` }))
      .catch(() => notifyCompact({ tone: "red", title: `Couldn’t close ${title}` }));
  };
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  });
  useEffect(() => {
    if (skipDialog) closeRef.current();
  }, [skipDialog]);

  if (!session || uncommitted === null || skipDialog) return null;

  return (
    <Overlay onClose={onDone}>
      <CloseTaskDialog
        task={{ title, branch: session.branch, uncommitted }}
        onCancel={onDone}
        onCommitFirst={() => {
          setAgentRunning(sessionId, true);
          void window.api.agentSend(sessionId, COMMIT_PROMPT);
          onDone();
        }}
        onClose={close}
      />
    </Overlay>
  );
}

export function AppCloseTask() {
  const sessionId = useCloseTaskStore((s) => s.sessionId);
  const hide = useCloseTaskStore((s) => s.hide);
  return sessionId ? <CloseTask key={sessionId} sessionId={sessionId} onDone={hide} /> : null;
}
