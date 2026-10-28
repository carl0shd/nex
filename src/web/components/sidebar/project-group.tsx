import { Folder, Plus } from "iconoir-react";
import GlideMenu from "@/components/primitives/glide-menu";
import { TaskRow } from "@/components/sidebar/task-row";
import type { SidebarProject } from "@/components/sidebar/types";

export function ProjectGroup({
  project,
  activeTaskId,
  onSelectTask,
}: {
  project: SidebarProject;
  activeTaskId?: string;
  onSelectTask?: (id: string) => void;
}) {
  return (
    <div className="mb-1.5 flex flex-col">
      <div className="flex h-[30px] items-center gap-2 pr-1.5 pl-4">
        <Folder width={13} height={13} strokeWidth={2} className="text-ink-4" />
        <span className="text-xs font-medium text-ink-2">{project.name}</span>
        <button
          type="button"
          aria-label={`New task in ${project.name}`}
          className="interactive press ml-auto flex size-[22px] cursor-pointer items-center justify-center rounded-full text-ink-4 hover:bg-hover hover:text-ink-2"
        >
          <Plus width={12} height={12} strokeWidth={2.25} />
        </button>
      </div>
      <GlideMenu
        className="ml-[22px] flex flex-col gap-px border-l border-line-tree pl-2"
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
    </div>
  );
}
