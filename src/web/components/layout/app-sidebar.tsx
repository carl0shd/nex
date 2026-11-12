import { useLocation, useNavigate } from "react-router";
import { useMemo } from "react";
import { EnvironmentsMeter } from "@/components/environment/machine-popover";
import { SidebarFrame } from "@/components/layout/sidebar-frame";
import { NewWorkspaceRow, type NewWorkspace } from "@/components/sidebar/new-workspace-row";
import { useEnvironments } from "@/hooks/use-environments";
import { useNow } from "@/hooks/use-now";
import { useAppHotkey } from "@/hooks/use-app-hotkey";
import { notifyCompact } from "@/lib/notify";
import { repoAt } from "@/lib/repo-at";
import { environmentsUsage, memoryBudget } from "@/lib/environments";
import { buildSidebar } from "@/lib/sidebar-model";
import { useAddProjectStore } from "@/stores/add-project.store";
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
  const createWorkspace = useWorkspaceStore((s) => s.createWorkspace);
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
  useAppHotkey("overview", openOverview);
  const now = useNow(AGE_REFRESH_MS);
  useEnvironments();
  const envStatus = useEnvironmentsStore((s) => s.status);
  const envMemory = usePreferencesStore((s) => s.prefs.envMemory);

  const workspaces = useMemo(
    () => buildSidebar({ workspaces: rawWorkspaces, projects, sessions, terminals }, now),
    [rawWorkspaces, projects, sessions, terminals, now],
  );

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
      activeTaskId={onHome ? (activeTaskId ?? undefined) : undefined}
      overviewActive={onHome && !activeTaskId}
      onToggleWorkspace={toggleWorkspace}
      onExpandWorkspace={expandWorkspace}
      onSelectTask={openTask}
      onOverview={openOverview}
      creating={creating && <NewWorkspaceRow onCreate={create} onCancel={hideNewWorkspace} />}
      environments={
        envStatus?.enabled && (
          <EnvironmentsMeter
            usage={environmentsUsage(envStatus, memoryBudget(envStatus, envMemory))}
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
