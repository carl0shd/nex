import { useState } from "react";
import { Ellipsis, Folder, FolderOpen, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { AnchoredPopover } from "@/components/primitives/anchored-popover";
import GlideMenu from "@/components/primitives/glide-menu";
import { Menu, MenuItem, MenuSeparator } from "@/components/primitives/menu";
import { cn } from "@/lib/utils";
import { TaskRow } from "@/components/sidebar/task-row";
import type { SidebarProject } from "@/components/sidebar/types";

export function ProjectGroup({
  project,
  activeTaskId,
  onSelectTask,
  onMinimizeTask,
  onCloseTask,
  onNewTask,
  onOpenInFinder,
  onRemove,
  onEdit,
}: {
  project: SidebarProject;
  activeTaskId?: string;
  onSelectTask?: (id: string) => void;
  onMinimizeTask?: (id: string, minimized: boolean) => void;
  onCloseTask?: (id: string) => void;
  onNewTask?: () => void;
  onOpenInFinder?: () => void;
  onRemove?: () => void;
  onEdit?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const hasMenu = Boolean(onOpenInFinder || onRemove || onEdit);
  const run = (action?: () => void) => () => {
    setMenuOpen(false);
    action?.();
  };
  return (
    <div className="mb-1.5 flex flex-col">
      <div
        onContextMenu={(event) => {
          if (!hasMenu) return;
          event.preventDefault();
          setMenuOpen(true);
        }}
        className="group/project flex h-[30px] items-center gap-2 pr-1.5 pl-4"
      >
        <Folder width={13} height={13} strokeWidth={2} className="text-ink-4" />
        <span title={project.name} className="truncate text-xs font-medium text-ink-2">
          {project.name}
        </span>
        {hasMenu && (
          <AnchoredPopover
            open={menuOpen}
            onOpenChange={setMenuOpen}
            align="end"
            strategy="fixed"
            className={cn(
              "ml-auto transition-opacity duration-150 ease-out-strong",
              menuOpen
                ? "opacity-100"
                : "opacity-0 group-hover/project:opacity-100 focus-within:opacity-100",
            )}
            trigger={
              <button
                type="button"
                aria-label={`${project.name} actions`}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
                className={cn(
                  "interactive press flex size-[22px] cursor-pointer items-center justify-center rounded-full text-ink-4 hover:bg-hover hover:text-ink-2",
                  menuOpen && "bg-hover text-ink-2",
                )}
              >
                <Ellipsis width={12} height={12} strokeWidth={2.25} />
              </button>
            }
          >
            <Menu width={200}>
              {onEdit && (
                <MenuItem icon={SlidersHorizontal} onSelect={run(onEdit)}>
                  Edit project
                </MenuItem>
              )}
              {onOpenInFinder && (
                <MenuItem icon={FolderOpen} onSelect={run(onOpenInFinder)}>
                  Open in Finder
                </MenuItem>
              )}
              {onOpenInFinder && onRemove && <MenuSeparator />}
              {onRemove && (
                <MenuItem icon={Trash2} danger onSelect={run(onRemove)}>
                  Remove from Nex
                </MenuItem>
              )}
            </Menu>
          </AnchoredPopover>
        )}
        <button
          type="button"
          aria-label={`New task in ${project.name}`}
          onClick={onNewTask}
          className={cn(
            "interactive press flex size-[22px] cursor-pointer items-center justify-center rounded-full text-ink-4 hover:bg-hover hover:text-ink-2",
            !hasMenu && "ml-auto",
          )}
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
            onMinimize={onMinimizeTask && ((minimized) => onMinimizeTask(task.id, minimized))}
            onClose={onCloseTask && (() => onCloseTask(task.id))}
          />
        ))}
      </GlideMenu>
    </div>
  );
}
