import { useLocation, useNavigate } from "react-router";
import { useMemo } from "react";
import { EnvironmentsMeter, NEARLY_FULL } from "@/components/environment/machine-popover";
import { SidebarFrame } from "@/components/layout/sidebar-frame";
import { NewWorkspaceRow, type NewWorkspace } from "@/components/sidebar/new-workspace-row";
import { useEnvironments, useViewedEnvironment } from "@/hooks/use-environments";
import { useNow } from "@/hooks/use-now";
import { useAppHotkey } from "@/hooks/use-app-hotkey";
import { notifyCompact } from "@/lib/notify";
import { repoAt } from "@/lib/repo-at";
import { environmentsUsage, memoryBudget } from "@/lib/environments";
import { buildSidebar, hiddenWorkspaces } from "@/lib/sidebar-model";
import { idleCount, machineEnvironments } from "@/lib/task-environment";
import { useAddProjectStore } from "@/stores/add-project.store";
import { useCloseTaskStore } from "@/stores/close-task.store";
import { useEnvironmentsStore } from "@/stores/environments.store";
import { useRemoveProjectStore } from "@/stores/remove-project.store";
import { useRemoveWorkspaceStore } from "@/stores/remove-workspace.store";
import { useNewTaskStore } from "@/stores/new-task.store";
import { useNewWorkspaceStore } from "@/stores/new-workspace.store";
import { usePreferencesStore } from "@/stores/preferences.store";
import { useWorkspaceStore } from "@/stores/workspace.store";

const AGE_REFRESH_MS = 60_000;

export function AppSidebar() {
  const rawWorkspaces = useWorkspaceStore((s) => s.workspaces);
  const projects = useWorkspaceStore((s) => s.projects);
  const sessions = useWorkspaceStore((s) => s.sessions);
  const terminals = useWorkspaceStore((s) => s.terminals);
  const activeTaskId = useWorkspaceStore((s) => s.activeTaskId);
  const toggleWorkspace = useWorkspaceStore((s) => s.toggleWorkspace);
  const expandWorkspace = useWorkspaceStore((s) => s.expandWorkspace);
  const openTask = useWorkspaceStore((s) => s.openTask);
  const showOverview = useWorkspaceStore((s) => s.showOverview);
  const showTasks = useWorkspaceStore((s) => s.showTasks);
  const homeView = useWorkspaceStore((s) => s.homeView);
  const createWorkspace = useWorkspaceStore((s) => s.createWorkspace);
  const setTaskMinimized = useWorkspaceStore((s) => s.setTaskMinimized);
  const setWorkspaceHidden = useWorkspaceStore((s) => s.setWorkspaceHidden);
  const showCloseTask = useCloseTaskStore((s) => s.show);
  const showNewTask = useNewTaskStore((s) => s.show);
  const showAddProject = useAddProjectStore((s) => s.show);
  const showEditProject = useAddProjectStore((s) => s.edit);
  const showRemoveProject = useRemoveProjectStore((s) => s.show);
  const showRemoveWorkspace = useRemoveWorkspaceStore((s) => s.show);
  const renameWorkspace = useWorkspaceStore((s) => s.renameWorkspace);
  const setWorkspaceLook = useWorkspaceStore((s) => s.setWorkspaceLook);
  const creating = useNewWorkspaceStore((s) => s.creating);
  const showNewWorkspace = useNewWorkspaceStore((s) => s.show);
  const hideNewWorkspace = useNewWorkspaceStore((s) => s.hide);
  const navigate = useNavigate();
  const onHome = useLocation().pathname === "/";
  const openOverview = () => {
    navigate("/");
    showOverview();
  };
  const openTasks = () => {
    navigate("/");
    showTasks();
  };
  useAppHotkey("overview", openOverview);
  const now = useNow(AGE_REFRESH_MS);
  useEnvironments();
  useViewedEnvironment(onHome ? activeTaskId : null);
  const envStatus = useEnvironmentsStore((s) => s.status);
  const environments = useEnvironmentsStore((s) => s.tasks);
  const pauseEnvironment = useEnvironmentsStore((s) => s.pauseTask);
  const pauseIdle = useEnvironmentsStore((s) => s.pauseIdle);
  const envMemory = usePreferencesStore((s) => s.prefs.envMemory);

  const workspaces = useMemo(
    () =>
      buildSidebar({ workspaces: rawWorkspaces, projects, sessions, terminals, environments }, now),
    [rawWorkspaces, projects, sessions, terminals, environments, now],
  );

  const hidden = useMemo(() => hiddenWorkspaces(rawWorkspaces), [rawWorkspaces]);

  const usage = useMemo(() => {
    if (!envStatus) return null;
    const budget = memoryBudget(envStatus, envMemory);
    const all = Object.values(environments);
    const machines = machineEnvironments(
      {
        environments: all,
        sessions,
        projects,
        nearlyFull: budget > 0 && envStatus.usage.usedGb / budget >= NEARLY_FULL,
      },
      now,
    );
    return environmentsUsage(envStatus, budget, machines, idleCount(all));
  }, [envStatus, envMemory, environments, sessions, projects, now]);

  const create = async (draft: NewWorkspace) => {
    hideNewWorkspace();
    try {
      const workspace = await createWorkspace(draft);
      notifyCompact(
        {
          tone: "green",
          title: `${draft.name} created`,
          action: "Add a project",
          onAction: () => showAddProject(workspace.id),
        },
        { duration: 6000 },
      );
    } catch {
      notifyCompact({ tone: "red", title: `Couldn’t create ${draft.name}` });
    }
  };

  return (
    <SidebarFrame
      workspaces={workspaces}
      hiddenWorkspaces={hidden}
      activeTaskId={onHome ? (activeTaskId ?? undefined) : undefined}
      overviewActive={onHome && !activeTaskId && homeView === "overview"}
      tasksActive={onHome && !activeTaskId && homeView === "tasks"}
      onToggleWorkspace={toggleWorkspace}
      onExpandWorkspace={expandWorkspace}
      onSelectTask={openTask}
      onMinimizeTask={setTaskMinimized}
      onCloseTask={showCloseTask}
      onOverview={openOverview}
      onTasks={openTasks}
      creating={creating && <NewWorkspaceRow onCreate={create} onCancel={hideNewWorkspace} />}
      environments={
        envStatus?.enabled &&
        usage && (
          <EnvironmentsMeter
            usage={usage}
            onPause={pauseEnvironment}
            onPauseIdle={pauseIdle}
            onSettings={() => navigate("/settings", { state: { section: "environments" } })}
          />
        )
      }
      onAddWorkspace={showNewWorkspace}
      onNewTask={() => showNewTask()}
      onNewTaskInProject={showNewTask}
      onAddProject={showAddProject}
      onRemoveProject={showRemoveProject}
      onEditProject={showEditProject}
      onHideWorkspace={(id) => setWorkspaceHidden(id, true)}
      onShowWorkspace={(id) => setWorkspaceHidden(id, false)}
      onRemoveWorkspace={showRemoveWorkspace}
      onRenameWorkspace={(id, name) => void renameWorkspace(id, name)}
      onWorkspaceLookChange={(id, look) => void setWorkspaceLook(id, look)}
      onOpenProjectInFinder={(id) => {
        const path = projects.find((project) => project.id === id)?.path;
        if (path) void window.api.openInFinder(path);
      }}
      onDropProject={async (workspaceId, file) => {
        const repo = await repoAt(window.api.pathForFile(file));
        if (repo) showAddProject(workspaceId, repo);
      }}
    />
  );
}
