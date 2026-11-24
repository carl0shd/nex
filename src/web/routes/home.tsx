import { useMemo, useRef, type ComponentProps } from "react";
import { useHotkeys, type Hotkey } from "@tanstack/react-hotkeys";
import { useNavigate } from "react-router";
import { AddAgentSlot } from "@/components/home/add-agent-slot";
import { AgentStrip, StripSummary } from "@/components/home/agent-strip";
import { AppHomePrompt } from "@/components/home/app-home-prompt";
import { HomeBackdrop } from "@/components/home/home-backdrop";
import { HomeHero } from "@/components/home/home-hero";
import { HomeStats } from "@/components/home/home-stats";
import { TasksEmpty } from "@/components/home/tasks-empty";
import { AppTaskCard } from "@/components/task/app-task-card";
import { useAppHotkey } from "@/hooks/use-app-hotkey";
import { useNewTaskLauncher } from "@/hooks/use-new-task-launcher";
import { useNow } from "@/hooks/use-now";
import { useUsageSummary } from "@/hooks/use-usage-summary";
import { rangeHotkeys } from "@/lib/app-shortcuts";
import { greeting, homeScenePhase, scenePhase } from "@/lib/dither-scene";
import { memoryBudget } from "@/lib/environments";
import { usageStats, type HomeStatsData } from "@/lib/home-stats";
import { buildSidebar, stripSessions } from "@/lib/sidebar-model";
import { statusCounts, taskStatusItems } from "@/lib/task-status";
import { useEnvironmentsStore } from "@/stores/environments.store";
import { useNewTaskStore } from "@/stores/new-task.store";
import { usePermissionStore } from "@/stores/permission.store";
import { usePreferencesStore } from "@/stores/preferences.store";
import { useSettingsStore } from "@/stores/settings.store";
import { useUsagePanelStore } from "@/stores/usage-panel.store";
import { useWorkspaceStore } from "@/stores/workspace.store";

function OverviewHero(props: Omit<ComponentProps<typeof HomeHero>, "prompt" | "ready">) {
  const launcher = useNewTaskLauncher();
  return (
    <HomeHero
      {...props}
      ready={Boolean(launcher)}
      prompt={launcher && <AppHomePrompt launcher={launcher} />}
    />
  );
}

function Home(): React.JSX.Element {
  const showNewTask = useNewTaskStore((s) => s.show);
  const openTask = useWorkspaceStore((s) => s.openTask);
  const showTasks = useWorkspaceStore((s) => s.showTasks);
  const showOverview = useWorkspaceStore((s) => s.showOverview);
  const homeView = useWorkspaceStore((s) => s.homeView);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const projects = useWorkspaceStore((s) => s.projects);
  const sessions = useWorkspaceStore((s) => s.sessions);
  const terminals = useWorkspaceStore((s) => s.terminals);
  const activeTaskId = useWorkspaceStore((s) => s.activeTaskId);
  const requests = usePermissionStore((s) => s.requests);
  const envStatus = useEnvironmentsStore((s) => s.status);
  const environments = useEnvironmentsStore((s) => s.tasks);
  const envMemory = usePreferencesStore((s) => s.prefs.envMemory);
  const showUsage = usePreferencesStore((s) => s.prefs.showUsage);
  const homeScene = usePreferencesStore((s) => s.prefs.homeScene);
  const { summary } = useUsageSummary({ watch: false });
  const openUsage = useUsagePanelStore((s) => s.setOpen);
  const navigate = useNavigate();
  const addAgentHint = useSettingsStore((s) => s.addAgentHint);
  const setAddAgentHint = useSettingsStore((s) => s.setAddAgentHint);
  const nowMs = useNow(60_000);
  const now = new Date(nowMs);
  const heroRef = useRef<HTMLDivElement>(null);
  const hour = now.getHours() + now.getMinutes() / 60;
  const open = stripSessions({ workspaces, projects, sessions });
  const statusItems = useMemo(
    () =>
      taskStatusItems(
        buildSidebar({ workspaces, projects, sessions, terminals }, nowMs),
        new Set(requests.map((request) => request.sessionId)),
      ),
    [workspaces, projects, sessions, terminals, requests, nowMs],
  );
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

  const phase = homeScenePhase(homeScene, hour);
  const backdrop = phase && (
    <HomeBackdrop
      phase={phase}
      focusRef={homeView === "overview" ? heroRef : undefined}
      fullWindow
    />
  );

  if (homeView === "overview") {
    const stats: HomeStatsData = {
      tasks: statusCounts(statusItems),
      ...(showUsage ? usageStats(summary, now) : {}),
      ...(envStatus?.enabled && {
        environments: {
          running: Object.values(environments).filter((env) => env.status === "running").length,
          usedGb: envStatus.usage.usedGb,
          totalGb: memoryBudget(envStatus, envMemory),
        },
      }),
    };
    return (
      <main className="relative flex min-w-0 flex-1">
        {backdrop}
        <OverviewHero
          phase={phase ?? scenePhase(hour)}
          greeting={greeting(hour)}
          backdrop={false}
          plain={!phase}
          contentRef={heroRef}
          stats={
            <HomeStats
              stats={stats}
              onTasks={showTasks}
              onUsage={() => openUsage(true)}
              onEnvironments={() => navigate("/settings", { state: { section: "environments" } })}
            />
          }
        />
      </main>
    );
  }

  return (
    <main className="relative flex min-w-0 flex-1">
      {backdrop}
      {open.length === 0 ? (
        <TasksEmpty onNewTask={() => showNewTask()} onOverview={showOverview} />
      ) : (
        <AgentStrip
          items={open.map((session) => ({
            id: session.id,
            name: session.title || session.name,
            waiting: statusItems.some(
              (item) => item.id === session.id && item.status === "waiting",
            ),
            card: <AppTaskCard sessionId={session.id} />,
          }))}
          initialId={activeTaskId ?? undefined}
          onSelect={openTask}
          summary={<StripSummary {...statusCounts(statusItems)} />}
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
      )}
    </main>
  );
}

export default Home;
