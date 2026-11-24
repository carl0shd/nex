import { useState, type ReactNode } from "react";
import { Sidebar } from "@/components/sidebar/sidebar";
import { SidebarRail } from "@/components/sidebar/sidebar-rail";
import type { HiddenWorkspace, SidebarWorkspace } from "@/components/sidebar/types";
import type { WorkspaceLookChange } from "@/components/sidebar/workspace-header";
import { useAppHotkey } from "@/hooks/use-app-hotkey";
import { SIDEBAR_WIDTH } from "@/lib/app-chrome";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/settings.store";

export function SidebarFrame({
  workspaces,
  hiddenWorkspaces,
  activeTaskId,
  overviewActive = !activeTaskId,
  tasksActive = false,
  creating,
  environments,
  onToggleWorkspace,
  onExpandWorkspace,
  onSelectTask,
  onMinimizeTask,
  onCloseTask,
  onOverview,
  onTasks,
  onNewTask,
  onNewTaskInProject,
  onOpenProjectInFinder,
  onRemoveProject,
  onEditProject,
  onRenameWorkspace,
  onWorkspaceLookChange,
  onHideWorkspace,
  onShowWorkspace,
  onRemoveWorkspace,
  onAddWorkspace,
  onAddProject,
  onDropProject,
}: {
  workspaces: SidebarWorkspace[];
  hiddenWorkspaces?: readonly HiddenWorkspace[];
  activeTaskId?: string;
  overviewActive?: boolean;
  tasksActive?: boolean;
  creating?: ReactNode;
  environments?: ReactNode;
  onToggleWorkspace?: (id: string) => void;
  onExpandWorkspace?: (id: string) => void;
  onSelectTask?: (id: string) => void;
  onMinimizeTask?: (id: string, minimized: boolean) => void;
  onCloseTask?: (id: string) => void;
  onOverview?: () => void;
  onTasks?: () => void;
  onNewTask?: () => void;
  onNewTaskInProject?: (projectId: string) => void;
  onOpenProjectInFinder?: (projectId: string) => void;
  onRemoveProject?: (projectId: string) => void;
  onEditProject?: (projectId: string) => void;
  onRenameWorkspace?: (workspaceId: string, name: string) => void;
  onWorkspaceLookChange?: (workspaceId: string, look: WorkspaceLookChange) => void;
  onHideWorkspace?: (workspaceId: string) => void;
  onShowWorkspace?: (workspaceId: string) => void;
  onRemoveWorkspace?: (workspaceId: string) => void;
  onAddWorkspace?: () => void;
  onAddProject?: (workspaceId: string) => void;
  onDropProject?: (workspaceId: string, file: File) => void;
}) {
  const collapsed = useSettingsStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useSettingsStore((s) => s.toggleSidebar);
  const [resizing, setResizing] = useState(false);
  const [shownCollapsed, setShownCollapsed] = useState(collapsed);
  if (shownCollapsed !== collapsed) {
    setShownCollapsed(collapsed);
    setResizing(true);
  }
  const addWorkspace = () => {
    if (collapsed) toggleSidebar();
    onAddWorkspace?.();
  };
  useAppHotkey("sidebar", toggleSidebar);
  useAppHotkey("workspace", addWorkspace);

  const needsYou = workspaces
    .flatMap((workspace) => workspace.projects)
    .flatMap((project) => project.tasks)
    .filter((task) => task.status === "waiting").length;

  return (
    <div
      onTransitionEnd={(event) => {
        if (event.target === event.currentTarget) setResizing(false);
      }}
      className={cn(
        "shrink-0 transition-[width] duration-[250ms] ease-out-strong",
        resizing && "overflow-hidden",
      )}
      style={{ width: collapsed ? SIDEBAR_WIDTH.rail : SIDEBAR_WIDTH.open }}
    >
      {collapsed ? (
        <SidebarRail
          workspaces={workspaces}
          activeTaskId={activeTaskId}
          needsYou={needsYou > 0}
          overviewActive={overviewActive}
          tasksActive={tasksActive}
          onOverview={onOverview}
          onTasks={onTasks}
          onNewTask={onNewTask}
          onAddWorkspace={addWorkspace}
          onSelectTask={onSelectTask}
          onOpenWorkspace={(id) => {
            onExpandWorkspace?.(id);
            toggleSidebar();
          }}
          className="h-full"
        />
      ) : (
        <Sidebar
          workspaces={workspaces}
          hiddenWorkspaces={hiddenWorkspaces}
          activeTaskId={activeTaskId}
          overviewActive={overviewActive}
          tasksActive={tasksActive}
          needsYou={needsYou}
          creating={creating}
          environments={environments}
          onToggleWorkspace={onToggleWorkspace}
          onSelectTask={onSelectTask}
          onMinimizeTask={onMinimizeTask}
          onCloseTask={onCloseTask}
          onOverview={onOverview}
          onTasks={onTasks}
          onNewTask={onNewTask}
          onNewTaskInProject={onNewTaskInProject}
          onOpenProjectInFinder={onOpenProjectInFinder}
          onRemoveProject={onRemoveProject}
          onEditProject={onEditProject}
          onRenameWorkspace={onRenameWorkspace}
          onWorkspaceLookChange={onWorkspaceLookChange}
          onHideWorkspace={onHideWorkspace}
          onShowWorkspace={onShowWorkspace}
          onRemoveWorkspace={onRemoveWorkspace}
          onAddWorkspace={onAddWorkspace}
          onAddProject={onAddProject}
          onDropProject={onDropProject}
          className="h-full"
        />
      )}
    </div>
  );
}
