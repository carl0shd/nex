import { useState } from "react";
import { GalleryHorizontalEnd, Globe, Minimize2, X } from "lucide-react";
import { Orbit } from "@/components/atoms/orbit";
import { StatusDot } from "@/components/atoms/status-dot";
import { AnchoredPopover } from "@/components/primitives/anchored-popover";
import { Menu, MenuItem, MenuSeparator } from "@/components/primitives/menu";
import { cn } from "@/lib/utils";
import type { SidebarTask } from "@/components/sidebar/types";

const DOT = { running: "green", waiting: "orange", idle: "idle" } as const;

export function TaskRow({
  task,
  active = false,
  onClick,
  onMinimize,
  onClose,
}: {
  task: SidebarTask;
  active?: boolean;
  onClick?: () => void;
  onMinimize?: (minimized: boolean) => void;
  onClose?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const waiting = task.status === "waiting";
  const minimized = Boolean(task.minimized);
  const hasMenu = Boolean(onMinimize || onClose);
  const run = (action?: () => void) => () => {
    setMenuOpen(false);
    action?.();
  };
  const row = (
    <button
      type="button"
      onClick={onClick}
      onContextMenu={(event) => {
        if (!hasMenu) return;
        event.preventDefault();
        setMenuOpen(true);
      }}
      data-menu-row
      className={cn(
        "interactive press-wide relative flex h-[30px] w-full cursor-pointer items-center gap-[9px] rounded-control px-2 text-left select-none",
        active ? "bg-surface shadow-tab" : waiting && "bg-orange-tint/70",
      )}
    >
      <StatusDot tone={DOT[task.status]} />
      <span
        title={task.title}
        className={cn(
          "truncate text-sm",
          active
            ? "text-ink"
            : minimized && !waiting
              ? "text-ink-4"
              : task.status === "idle"
                ? "text-ink-3"
                : "text-ink-2",
        )}
      >
        {task.title}
      </span>
      {minimized && (
        <span title="Minimized" className="ml-auto flex shrink-0 text-ink-5">
          <Minimize2 width={11} height={11} strokeWidth={2.25} />
        </span>
      )}
      {task.env === "starting" && <Orbit size="sm" className={cn(!minimized && "ml-auto")} />}
      {task.env === "down" && (
        <Globe
          width={12}
          height={12}
          strokeWidth={2}
          className={cn("shrink-0 text-red", !minimized && "ml-auto")}
        />
      )}
      <span
        className={cn(
          "shrink-0 text-2xs",
          !task.env && !minimized && "ml-auto",
          waiting ? "text-orange" : "text-ink-4",
        )}
      >
        {task.meta}
      </span>
    </button>
  );
  if (!hasMenu) return row;
  return (
    <AnchoredPopover
      open={menuOpen}
      onOpenChange={setMenuOpen}
      align="end"
      side="bottom"
      strategy="fixed"
      trigger={row}
    >
      <Menu width={200}>
        {onMinimize &&
          (minimized ? (
            <MenuItem icon={GalleryHorizontalEnd} onSelect={run(() => onMinimize(false))}>
              Show in Tasks
            </MenuItem>
          ) : (
            <MenuItem icon={Minimize2} onSelect={run(() => onMinimize(true))}>
              Minimize
            </MenuItem>
          ))}
        {onMinimize && onClose && <MenuSeparator />}
        {onClose && (
          <MenuItem icon={X} danger onSelect={run(onClose)}>
            Close task
          </MenuItem>
        )}
      </Menu>
    </AnchoredPopover>
  );
}
