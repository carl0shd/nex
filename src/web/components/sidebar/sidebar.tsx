import type { ReactNode } from "react";
import { GalleryHorizontalEnd, LayoutGrid, Plus, SquarePen } from "lucide-react";
import { Kbd } from "@/components/atoms/kbd";
import GlideMenu from "@/components/primitives/glide-menu";
import { ProjectGroup } from "@/components/sidebar/project-group";
import { SidebarLink } from "@/components/sidebar/sidebar-link";
import { WorkspaceHeader, type WorkspaceLookChange } from "@/components/sidebar/workspace-header";
import type { SidebarWorkspace } from "@/components/sidebar/types";
import { AddProjectRow } from "@/components/sidebar/add-project-row";
import { cn } from "@/lib/utils";
import { shortcutLabel } from "@/lib/app-shortcuts";

export function Sidebar({
  workspaces,
  activeTaskId,
  overviewActive = !activeTaskId,
  tasksActive = false,
  needsYou = 0,
  creating,
  environments,
  onAddWorkspace,
  onAddProject,
  onDropProject,
  onToggleWorkspace,
  onSelectTask,
  onOverview,
  onTasks,
  onNewTask,
  onNewTaskInProject,
  onOpenProjectInFinder,
  onRemoveProject,
  onEditProject,
  onRenameWorkspace,
  onWorkspaceLookChange,
  onRemoveWorkspace,
  className,
}: {
  workspaces: SidebarWorkspace[];
  activeTaskId?: string;
  overviewActive?: boolean;
  tasksActive?: boolean;
  needsYou?: number;
  creating?: ReactNode;
  environments?: ReactNode;
  onAddWorkspace?: () => void;
  onAddProject?: (workspaceId: string) => void;
  onDropProject?: (workspaceId: string, file: File) => void;
  onToggleWorkspace?: (workspaceId: string) => void;
  onSelectTask?: (taskId: string) => void;
  onOverview?: () => void;
  onTasks?: () => void;
  onNewTask?: () => void;
  onNewTaskInProject?: (projectId: string) => void;
  onOpenProjectInFinder?: (projectId: string) => void;
  onRemoveProject?: (projectId: string) => void;
  onEditProject?: (projectId: string) => void;
  onRenameWorkspace?: (workspaceId: string, name: string) => void;
  onWorkspaceLookChange?: (workspaceId: string, look: WorkspaceLookChange) => void;
  onRemoveWorkspace?: (workspaceId: string) => void;
  className?: string;
}) {
  return (
    <aside
      aria-label="Navigation"
      className={cn("relative flex w-[260px] shrink-0 flex-col px-2 pt-1.5", className)}
    >
      <GlideMenu className="flex flex-col gap-px">
        <SidebarLink
          icon={SquarePen}
          accentIcon
          label="New task"
          trailing={<Kbd>{shortcutLabel("new-task")}</Kbd>}
          onClick={onNewTask}
        />
        <SidebarLink
          icon={LayoutGrid}
          label="Overview"
          active={overviewActive}
          onClick={onOverview}
        />
        <SidebarLink
          icon={GalleryHorizontalEnd}
          label="Tasks"
          active={tasksActive}
          onClick={onTasks}
          trailing={
            needsYou > 0 && <span className="text-2xs text-orange tabular-nums">{needsYou}</span>
          }
        />
      </GlideMenu>
      <span className="mx-2.5 mt-3 h-px shrink-0 bg-line-tree" />
      <div className="-mx-2 mt-2.5 flex min-h-0 flex-col overflow-y-auto px-2 pb-2">
        {workspaces.map((workspace) => (
          <div key={workspace.id} className="flex flex-col">
            <WorkspaceHeader
              workspace={workspace}
              onToggle={() => onToggleWorkspace?.(workspace.id)}
              onAddProject={onAddProject && (() => onAddProject(workspace.id))}
              onRename={onRenameWorkspace && ((name) => onRenameWorkspace(workspace.id, name))}
              onLookChange={
                onWorkspaceLookChange && ((look) => onWorkspaceLookChange(workspace.id, look))
              }
              onRemove={onRemoveWorkspace && (() => onRemoveWorkspace(workspace.id))}
            />
            {workspace.expanded &&
              workspace.projects.map((project) => (
                <ProjectGroup
                  key={project.id ?? project.name}
                  project={project}
                  activeTaskId={activeTaskId}
                  onSelectTask={onSelectTask}
                  onNewTask={() => onNewTaskInProject?.(project.id ?? project.name)}
                  onOpenInFinder={
                    onOpenProjectInFinder && project.id
                      ? () => onOpenProjectInFinder(project.id ?? "")
                      : undefined
                  }
                  onRemove={
                    onRemoveProject && project.id
                      ? () => onRemoveProject(project.id ?? "")
                      : undefined
                  }
                  onEdit={
                    onEditProject && project.id ? () => onEditProject(project.id ?? "") : undefined
                  }
                />
              ))}
            {workspace.expanded && workspace.projects.length === 0 && (
              <AddProjectRow
                onClick={() => onAddProject?.(workspace.id)}
                onDropFolder={onDropProject && ((file) => onDropProject(workspace.id, file))}
              />
            )}
          </div>
        ))}
      </div>
      {creating}
      <div className="mt-auto flex flex-col gap-1 border-t border-line pt-2.5 pb-3">
        {environments}
        <button
          type="button"
          onClick={onAddWorkspace}
          aria-pressed={Boolean(creating)}
          className={cn(
            "interactive press-wide flex h-[30px] cursor-pointer items-center gap-2 rounded-control px-2 text-xs font-medium select-none",
            creating ? "bg-hover-2 text-ink" : "text-ink-3 hover:bg-hover",
          )}
        >
          <Plus width={12} height={12} strokeWidth={2.25} />
          Add workspace
          <span className="ml-1.5 text-3xs text-ink-4">{shortcutLabel("workspace")}</span>
        </button>
      </div>
    </aside>
  );
}
