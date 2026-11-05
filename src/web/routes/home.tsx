import { AddAgentSlot } from "@/components/home/add-agent-slot";
import { useHotkeys, type Hotkey } from "@tanstack/react-hotkeys";
import { useAppHotkey } from "@/hooks/use-app-hotkey";
import { rangeHotkeys } from "@/lib/app-shortcuts";
import { AgentStrip, StripSummary } from "@/components/home/agent-strip";
import { HomeEmpty } from "@/components/home/home-empty";
import { AppTaskCard } from "@/components/task/app-task-card";
import { useNewTaskStore } from "@/stores/new-task.store";
import { usePermissionStore } from "@/stores/permission.store";
import { useSettingsStore } from "@/stores/settings.store";
import { useWorkspaceStore } from "@/stores/workspace.store";

function Home(): React.JSX.Element {
  const showNewTask = useNewTaskStore((s) => s.show);
  const openTask = useWorkspaceStore((s) => s.openTask);
  const sessions = useWorkspaceStore((s) => s.sessions);
  const terminals = useWorkspaceStore((s) => s.terminals);
  const activeTaskId = useWorkspaceStore((s) => s.activeTaskId);
  const requests = usePermissionStore((s) => s.requests);
  const addAgentHint = useSettingsStore((s) => s.addAgentHint);
  const setAddAgentHint = useSettingsStore((s) => s.setAddAgentHint);
  const open = sessions.filter((session) => session.status !== "done");
  const step = (offset: 1 | -1) => {
    if (open.length === 0) return;
    const index = open.findIndex((session) => session.id === activeTaskId);
    const next = open[(index + offset + open.length) % open.length];
    if (next) openTask(next.id);
  };
  useAppHotkey("next", () => step(1));
  useAppHotkey("previous", () => step(-1));
  useHotkeys(
    rangeHotkeys("tasks").map((hotkey, index) => ({
      hotkey: hotkey as Hotkey,
      callback: () => {
        const task = open[index];
        if (task) openTask(task.id);
      },
    })),
  );

  if (open.length === 0) {
    return (
      <main className="flex min-w-0 flex-1">
        <HomeEmpty onNewTask={() => showNewTask()} />
      </main>
    );
  }

  const statusOf = (sessionId: string) =>
    requests.some((request) => request.sessionId === sessionId)
      ? "waiting"
      : (terminals.find((terminal) => terminal.sessionId === sessionId && terminal.type === "agent")
          ?.status ?? "idle");
  const count = (status: string) =>
    open.filter((session) => statusOf(session.id) === status).length;

  return (
    <main className="flex min-w-0 flex-1">
      <AgentStrip
        items={open.map((session) => ({
          id: session.id,
          name: session.title || session.name,
          waiting: statusOf(session.id) === "waiting",
          card: <AppTaskCard sessionId={session.id} />,
        }))}
        initialId={activeTaskId ?? undefined}
        onSelect={openTask}
        summary={
          <StripSummary
            working={count("running")}
            waiting={count("waiting")}
            idle={count("idle")}
          />
        }
        trailing={
          addAgentHint && (
            <AddAgentSlot
              onClick={() => {
                setAddAgentHint(false);
                showNewTask();
              }}
            />
          )
        }
      />
    </main>
  );
}

export default Home;
