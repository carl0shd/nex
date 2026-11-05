import { Folder } from "lucide-react";
import { Monogram } from "@/components/atoms/entity-chip";
import { KeyText } from "@/components/atoms/kbd";
import GlideMenu from "@/components/primitives/glide-menu";
import { TaskRow } from "@/components/sidebar/task-row";
import type { SidebarWorkspace } from "@/components/sidebar/types";
import { workspaceSummary } from "@/lib/sidebar-model";
import { cn } from "@/lib/utils";
import { shortcutLabel } from "@/lib/app-shortcuts";

export function WorkspacePeek({
  workspace,
  activeTaskId,
  onSelectTask,
  className,
  style,
  onMouseEnter,
  onMouseLeave,
}: {
  workspace: SidebarWorkspace;
  activeTaskId?: string;
  onSelectTask?: (taskId: string) => void;
  className?: string;
  style?: React.CSSProperties;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-label={workspace.name}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "enter-pop flex w-[272px] flex-col rounded-menu bg-surface-raised p-2 shadow-overlay",
        className,
      )}
      style={{ transformOrigin: "top left", ...style }}
    >
      <div className="flex h-8 items-center gap-2 px-2">
        <Monogram color={workspace.color} image={workspace.image}>
          {workspace.name[0]}
        </Monogram>
        <span title={workspace.name} className="truncate text-sm font-semibold text-ink">
          {workspace.name}
        </span>
        <span className="ml-auto shrink-0 text-2xs text-ink-4">{workspaceSummary(workspace)}</span>
      </div>
      {workspace.projects.length === 0 && (
        <span className="px-2 py-1.5 text-xs text-ink-4">No projects yet</span>
      )}
      {workspace.projects.map((project) => (
        <div key={project.id ?? project.name} className="mt-1 flex flex-col">
          <span className="flex h-[26px] items-center gap-[7px] px-2 text-xs font-medium text-ink-3">
            <Folder width={12} height={12} strokeWidth={2} className="shrink-0 text-ink-4" />
            <span title={project.name} className="truncate">
              {project.name}
            </span>
          </span>
          {project.tasks.length > 0 && (
            <GlideMenu
              className="ml-3.5 flex flex-col gap-px border-l border-line-tree pl-2"
              highlightClassName="left-2 right-0 rounded-control bg-hover"
            >
              {project.tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  active={task.id === activeTaskId}
                  onClick={() => onSelectTask?.(task.id)}
                />
              ))}
            </GlideMenu>
          )}
        </div>
      ))}
      <span className="mt-1.5 flex gap-3.5 border-t border-line px-2 pt-2 pb-0.5 text-2xs text-ink-4">
        <span>
          <KeyText>↵ open</KeyText>
        </span>
        <span>{shortcutLabel("sidebar")} pin sidebar open</span>
      </span>
    </div>
  );
}
