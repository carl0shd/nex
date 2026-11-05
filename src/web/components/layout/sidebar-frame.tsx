import { useState, type ReactNode } from "react";
import { Sidebar } from "@/components/sidebar/sidebar";
import { SidebarRail } from "@/components/sidebar/sidebar-rail";
import type { SidebarWorkspace } from "@/components/sidebar/types";
import type { WorkspaceLookChange } from "@/components/sidebar/workspace-header";
import { useAppHotkey } from "@/hooks/use-app-hotkey";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/settings.store";

export function SidebarFrame({
  workspaces,
  activeTaskId,
  overviewActive = !activeTaskId,
  creating,
  environments,
  onToggleWorkspace,
  onExpandWorkspace,
  onSelectTask,
  onOverview,
  onNewTask,
  onNewTaskInProject,
  onOpenProjectInFinder,
  onRemoveProject,
  onEditProject,
  onRenameWorkspace,
  onWorkspaceLookChange,
  onRemoveWorkspace,
  onAddWorkspace,
  onAddProject,
  onDropProject,
}: {
  workspaces: SidebarWorkspace[];
  activeTaskId?: string;
  overviewActive?: boolean;
  creating?: ReactNode;
  environments?: ReactNode;
  onToggleWorkspace?: (id: string) => void;
  onExpandWorkspace?: (id: string) => void;
  onSelectTask?: (id: string) => void;
  onOverview?: () => void;
  onNewTask?: () => void;
  onNewTaskInProject?: (projectId: string) => void;
  onOpenProjectInFinder?: (projectId: string) => void;
  onRemoveProject?: (projectId: string) => void;
  onEditProject?: (projectId: string) => void;
  onRenameWorkspace?: (workspaceId: string, name: string) => void;
  onWorkspaceLookChange?: (workspaceId: string, look: WorkspaceLookChange) => void;
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
        collapsed ? "w-[52px]" : "w-[260px]",
      )}
    >
      {collapsed ? (
        <SidebarRail
          workspaces={workspaces}
          activeTaskId={activeTaskId}
          needsYou={needsYou > 0}
          overviewActive={overviewActive}
          onOverview={onOverview}
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
          activeTaskId={activeTaskId}
          overviewActive={overviewActive}
          needsYou={needsYou}
          creating={creating}
          environments={environments}
          onToggleWorkspace={onToggleWorkspace}
          onSelectTask={onSelectTask}
          onOverview={onOverview}
          onNewTask={onNewTask}
          onNewTaskInProject={onNewTaskInProject}
          onOpenProjectInFinder={onOpenProjectInFinder}
          onRemoveProject={onRemoveProject}
          onEditProject={onEditProject}
          onRenameWorkspace={onRenameWorkspace}
          onWorkspaceLookChange={onWorkspaceLookChange}
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
