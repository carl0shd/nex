import { useEffect, useRef, useState } from "react";
import { useHotkeys, type Hotkey } from "@tanstack/react-hotkeys";
import { rangeHotkeys } from "@/lib/app-shortcuts";
import { useShallow } from "zustand/react/shallow";
import { ChangesView } from "@/components/changes/changes-view";
import { ResizeHandle } from "@/components/primitives/resize-handle";
import { AppTaskAgent, type AgentHandle } from "@/components/task/app-task-agent";
import { useEmptyClick } from "@/hooks/use-empty-click";
import { AppTaskNotes } from "@/components/task/app-task-notes";
import { AppTaskShell } from "@/components/task/app-task-shell";
import { QuickCommandChips } from "@/components/task/quick-command-chips";
import { TaskCard } from "@/components/task/task-card";
import { TaskHeader, type TaskStatus } from "@/components/task/task-header";
import { TaskTabBar, type TaskView } from "@/components/task/task-tab-bar";
import { stripCardMaxWidth } from "@/lib/agent-strip";
import { prefillTerminal } from "@/lib/terminal-prefill";
import { useAddProjectStore } from "@/stores/add-project.store";
import { useWorktreeChanges } from "@/hooks/use-worktree-changes";
import { workspaceImageUrl } from "@/lib/workspace-image";
import { notifyCompact } from "@/lib/notify";
import { useCloseTaskStore } from "@/stores/close-task.store";
import { usePreferencesStore } from "@/stores/preferences.store";
import { usePermissionStore } from "@/stores/permission.store";
import { useWorkspaceStore } from "@/stores/workspace.store";

const MIN_CARD_WIDTH = 600;

function openWith(app: string, path: string) {
  void window.api.openWith(app, path).then((opened) => {
    if (!opened) notifyCompact({ tone: "red", title: `Couldn’t open ${app}` });
  });
}

const STATUS: Record<"idle" | "running" | "waiting", TaskStatus> = {
  idle: "idle",
  running: "working",
  waiting: "waiting",
};

export function AppTaskCard({ sessionId }: { sessionId: string }) {
  const session = useWorkspaceStore((s) => s.sessions.find((item) => item.id === sessionId));
  const project = useWorkspaceStore((s) =>
    s.projects.find((item) => item.id === session?.projectId),
  );
  const workspace = useWorkspaceStore((s) =>
    s.workspaces.find((item) => item.id === project?.workspaceId),
  );
  const agent = useWorkspaceStore((s) =>
    s.terminals.find((item) => item.sessionId === sessionId && item.type === "agent"),
  );
  const focused = useWorkspaceStore((s) => s.activeTaskId === sessionId);
  const asking = usePermissionStore((s) => s.requests.some((item) => item.sessionId === sessionId));
  const selectTask = useWorkspaceStore((s) => s.selectTask);
  const renameTask = useWorkspaceStore((s) => s.renameTask);
  const setTaskWidth = useWorkspaceStore((s) => s.setTaskWidth);
  const ide = usePreferencesStore((s) => s.prefs.ide);
  const terminalApp = usePreferencesStore((s) => s.prefs.terminalApp);
  const taskRef = useRef<HTMLElement>(null);
  const runQuickCommand = useWorkspaceStore((s) => s.runQuickCommand);
  const addShell = useWorkspaceStore((s) => s.addShell);
  const setAgentRunning = useWorkspaceStore((s) => s.setAgentRunning);
  const shells = useWorkspaceStore(
    useShallow((s) =>
      s.terminals.filter((item) => item.sessionId === sessionId && item.type === "shell"),
    ),
  );
  const closeTerminal = useWorkspaceStore((s) => s.closeTerminal);
  const editProject = useAddProjectStore((s) => s.edit);
  const showCloseTask = useCloseTaskStore((s) => s.show);
  const [chosenView, setView] = useState<TaskView>("agent");
  const view: TaskView = !agent && chosenView === "agent" ? "shell" : chosenView;
  const tabOrder: TaskView[] = agent
    ? ["agent", "changes", "notes", "shell"]
    : ["shell", "changes", "notes"];
  useHotkeys(
    rangeHotkeys("views").map((hotkey, index) => ({
      hotkey: hotkey as Hotkey,
      callback: () => {
        const next = tabOrder[index];
        if (!next) return;
        setView(next);
        if (next === "agent") requestAnimationFrame(() => agentRef.current?.focusReply());
      },
    })),
    { enabled: focused },
  );
  const [shellFocus, setShellFocus] = useState<string>();
  const agentRef = useRef<AgentHandle>(null);
  const replyFocus = useWorkspaceStore((s) =>
    s.replyFocus?.sessionId === sessionId ? s.replyFocus : null,
  );
  useEffect(() => {
    if (!replyFocus) return;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      if (replyFocus.insert) setView("agent");
      inner = requestAnimationFrame(() => agentRef.current?.focusReply(replyFocus.insert));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [replyFocus]);
  const viewRequest = useWorkspaceStore((s) =>
    s.viewRequest?.sessionId === sessionId ? s.viewRequest : null,
  );
  useEffect(() => {
    if (!viewRequest) return;
    const frame = requestAnimationFrame(() => setView(viewRequest.view));
    return () => cancelAnimationFrame(frame);
  }, [viewRequest]);
  const focusReplyOnEmptyClick = useEmptyClick(() => agentRef.current?.focusReply());
  const files = useWorktreeChanges(session?.worktreePath ?? "", session?.baseBranch ?? "");

  if (!session || !project || !workspace) return null;

  const status = asking ? "waiting" : STATUS[agent?.status ?? "idle"];
  const diff = files.reduce(
    (sum, file) => ({ added: sum.added + file.added, removed: sum.removed + file.removed }),
    { added: 0, removed: 0 },
  );

  return (
    <div
      className="relative flex h-full"
      onPointerDownCapture={() => selectTask(sessionId)}
      onClick={view === "agent" ? focusReplyOnEmptyClick : undefined}
    >
      <TaskCard
        state={status === "waiting" ? "waiting" : focused ? "focused" : "rest"}
        className="h-full"
        ref={taskRef}
        style={{
          width: Math.max(MIN_CARD_WIDTH, session.width),
          maxWidth: stripCardMaxWidth(MIN_CARD_WIDTH),
        }}
      >
        <TaskHeader
          title={session.title || session.name}
          project={project.name}
          branch={session.branch || "no branch"}
          workspace={{
            name: workspace.name,
            color: workspace.color,
            image: workspaceImageUrl(workspace.customImage),
          }}
          status={status}
          actions={{
            onRename: (title) => void renameTask(sessionId, title),
            onOpenInFinder: () => void window.api.openInFinder(session.worktreePath),
            openInEditor: { app: ide, run: () => openWith(ide, session.worktreePath) },
            openInTerminal: {
              app: terminalApp,
              run: () => openWith(terminalApp, session.worktreePath),
            },
            onCopyBranch: () => {
              void navigator.clipboard.writeText(session.branch);
              notifyCompact({ tone: "green", title: "Branch name copied" });
            },
            onClose: () => showCloseTask(sessionId),
          }}
        />
        <TaskTabBar
          view={view}
          hasAgent={Boolean(agent)}
          onViewChange={(next) => {
            setView(next);
            if (next === "agent") requestAnimationFrame(() => agentRef.current?.focusReply());
          }}
          agentWaiting={status === "waiting"}
          diff={diff}
          trailing={
            <QuickCommandChips
              commands={project.quickCommands.map((command) => {
                const shell = shells.find((item) => item.name === command.name);
                return {
                  name: command.name,
                  command: command.command,
                  running: Boolean(shell),
                };
              })}
              onOpenTerminal={(name) => {
                const shell = shells.find((item) => item.name === name);
                if (!shell) return;
                setShellFocus(shell.id);
                setView("shell");
              }}
              onStop={(name) => {
                const shell = shells.find((item) => item.name === name);
                if (shell) void closeTerminal(shell.id);
              }}
              onEdit={() => editProject(project.id)}
              onRun={(name) => {
                const command = project.quickCommands.find((item) => item.name === name);
                if (!command) return;
                void runQuickCommand(sessionId, command).then((id) => {
                  setShellFocus(id);
                  setView("shell");
                });
              }}
            />
          }
        />
        {view === "agent" && agent && (
          <AppTaskAgent
            ref={agentRef}
            sessionId={sessionId}
            terminalId={agent.id}
            cwd={session.worktreePath}
            branch={session.branch}
            base={session.baseBranch}
            working={status === "working"}
            focused={focused}
            changedFiles={files}
            onViewChanges={() => setView("changes")}
            onOpenInTerminal={(command) =>
              void addShell(sessionId).then((id) => {
                prefillTerminal(id, command);
                setShellFocus(id);
                setView("shell");
              })
            }
          />
        )}
        {view === "changes" && (
          <ChangesView
            files={files}
            onAsk={(question, lines, text) => {
              const quoted = text?.trim() ? `\n\n\`\`\`\n${text.trim()}\n\`\`\`` : "";
              setAgentRunning(sessionId, true);
              void window.api.agentSend(sessionId, `${lines}${quoted}\n\n${question}`);
              setView("agent");
            }}
          />
        )}
        {view === "notes" && (
          <AppTaskNotes
            sessionId={sessionId}
            onSendToClaude={
              agent
                ? (markdown) => {
                    void window.api.writeSessionNotes(sessionId, markdown);
                    setAgentRunning(sessionId, true);
                    void window.api.agentSend(
                      sessionId,
                      `Here are my notes for this task:\n\n${markdown}`,
                    );
                    setView("agent");
                  }
                : undefined
            }
          />
        )}
        {view === "shell" && <AppTaskShell sessionId={sessionId} focusId={shellFocus} />}
      </TaskCard>
      <ResizeHandle
        width={Math.max(MIN_CARD_WIDTH, session.width)}
        min={MIN_CARD_WIDTH}
        measure={() => {
          const task = taskRef.current;
          if (!task) return { width: session.width, max: MIN_CARD_WIDTH };
          const max = parseFloat(getComputedStyle(task).maxWidth);
          return { width: task.offsetWidth, max: Number.isFinite(max) ? max : Infinity };
        }}
        onResize={(width) => {
          if (taskRef.current) taskRef.current.style.width = `${width}px`;
        }}
        onCommit={(width) => setTaskWidth(sessionId, width)}
        className="absolute inset-y-6 -right-2.5 w-2.5"
      />
    </div>
  );
}
