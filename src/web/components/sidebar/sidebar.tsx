import type { ReactNode } from "react";
import { EditPencil, Plus, ViewGrid } from "iconoir-react";
import { Kbd } from "@/components/atoms/kbd";
import GlideMenu from "@/components/primitives/glide-menu";
import { ProjectGroup } from "@/components/sidebar/project-group";
import { SidebarLink } from "@/components/sidebar/sidebar-link";
import { WorkspaceHeader } from "@/components/sidebar/workspace-header";
import type { SidebarWorkspace } from "@/components/sidebar/types";
import { AddProjectRow } from "@/components/sidebar/add-project-row";
import { cn } from "@/lib/utils";

export function Sidebar({
  workspaces,
  activeTaskId,
  needsYou = 0,
  creating,
  environments,
  onAddWorkspace,
  onAddProject,
  onToggleWorkspace,
  className,
}: {
  workspaces: SidebarWorkspace[];
  activeTaskId?: string;
  needsYou?: number;
  creating?: ReactNode;
  environments?: ReactNode;
  onAddWorkspace?: () => void;
  onAddProject?: (workspaceId: string) => void;
  onToggleWorkspace?: (workspaceId: string) => void;
  className?: string;
}) {
  return (
    <aside
      aria-label="Navigation"
      className={cn("relative flex w-[260px] shrink-0 flex-col bg-page px-2 pt-1.5", className)}
    >
      <GlideMenu className="flex flex-col gap-px">
        <SidebarLink icon={EditPencil} accentIcon label="New task" trailing={<Kbd>⌘T</Kbd>} />
        <SidebarLink
          icon={ViewGrid}
          label="Overview"
          active={!activeTaskId}
          trailing={
            needsYou > 0 && <span className="text-2xs text-orange tabular-nums">{needsYou}</span>
          }
        />
      </GlideMenu>
      <div className="mt-[18px] flex flex-col">
        {workspaces.map((workspace) => (
          <div key={workspace.id} className="flex flex-col">
            <WorkspaceHeader
              workspace={workspace}
              onToggle={() => onToggleWorkspace?.(workspace.id)}
            />
            {workspace.expanded &&
              workspace.projects.map((project) => (
                <ProjectGroup key={project.name} project={project} activeTaskId={activeTaskId} />
              ))}
            {workspace.expanded && workspace.projects.length === 0 && (
              <AddProjectRow onClick={() => onAddProject?.(workspace.id)} />
            )}
          </div>
        ))}
        {creating}
      </div>
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
          <span className="ml-1.5 text-3xs text-ink-4">⌘⇧N</span>
        </button>
      </div>
    </aside>
  );
}
