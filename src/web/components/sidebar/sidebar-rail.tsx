import { useHotkey } from "@tanstack/react-hotkeys";
import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { LayoutGrid, Plus, SquarePen } from "lucide-react";
import { Monogram } from "@/components/atoms/entity-chip";
import GlideMenu from "@/components/primitives/glide-menu";
import { cn } from "@/lib/utils";
import type { SidebarWorkspace } from "@/components/sidebar/types";
import { WorkspacePeek } from "@/components/sidebar/workspace-peek";
import { shortcutLabel } from "@/lib/app-shortcuts";

type RailIcon = ComponentType<{ width?: number; height?: number; strokeWidth?: number }>;

function RailButton({
  label,
  active = false,
  hovered = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
  className,
  children,
}: {
  label: string;
  active?: boolean;
  hovered?: boolean;
  onClick?: () => void;
  onMouseEnter?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseLeave?: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={onMouseEnter ? undefined : label}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      data-menu-row
      className={cn(
        "interactive press relative flex size-9 cursor-pointer items-center justify-center rounded-[9px] select-none",
        active ? "bg-surface text-ink shadow-tab" : hovered && "bg-hover",
        className,
      )}
    >
      {children}
    </button>
  );
}

function RailGlyph({ icon: Icon, size = 16 }: { icon: RailIcon; size?: number }) {
  return <Icon width={size} height={size} strokeWidth={2} />;
}

const PEEK_OPEN_MS = 120;
const PEEK_CLOSE_MS = 160;

function useWorkspacePeek(initialId?: string) {
  const [peek, setPeek] = useState<{ id: string; top: number } | null>(
    initialId ? { id: initialId, top: 88 } : null,
  );
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const schedule = (next: typeof peek, delay: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setPeek(next), delay);
  };
  return {
    peek,
    open: (id: string, top: number) => schedule({ id, top }, peek ? 0 : PEEK_OPEN_MS),
    keep: () => clearTimeout(timer.current),
    close: () => schedule(null, PEEK_CLOSE_MS),
    dismiss: () => {
      clearTimeout(timer.current);
      setPeek(null);
    },
  };
}

export function SidebarRail({
  workspaces,
  activeWorkspaceId,
  hoveredWorkspaceId,
  activeTaskId,
  needsYou = false,
  overviewActive = true,
  onOpenWorkspace,
  onSelectTask,
  onOverview,
  onNewTask,
  onAddWorkspace,
  className,
}: {
  workspaces: SidebarWorkspace[];
  activeWorkspaceId?: string;
  hoveredWorkspaceId?: string;
  needsYou?: boolean;
  overviewActive?: boolean;
  activeTaskId?: string;
  onOpenWorkspace?: (workspaceId: string) => void;
  onSelectTask?: (taskId: string) => void;
  onOverview?: () => void;
  onNewTask?: () => void;
  onAddWorkspace?: () => void;
  className?: string;
}) {
  const asideRef = useRef<HTMLElement>(null);
  const { peek, open, keep, close, dismiss } = useWorkspacePeek(hoveredWorkspaceId);
  const peeked = workspaces.find((workspace) => workspace.id === peek?.id);
  useHotkey(
    "Enter",
    () => {
      if (!peeked) return;
      dismiss();
      onOpenWorkspace?.(peeked.id);
    },
    { enabled: Boolean(peeked) },
  );
  const openPeek = (id: string, button: HTMLElement) => {
    const asideTop = asideRef.current?.getBoundingClientRect().top ?? 0;
    open(id, button.getBoundingClientRect().top - asideTop);
  };

  return (
    <aside
      ref={asideRef}
      aria-label="Navigation"
      className={cn("relative flex w-[52px] shrink-0 flex-col bg-page pt-1.5", className)}
    >
      <GlideMenu
        className="flex flex-col items-center gap-0.5"
        highlightClassName="left-1/2 w-9 -translate-x-1/2 rounded-[9px] bg-hover"
      >
        <RailButton
          label={`New task, ${shortcutLabel("new-task")}`}
          onClick={onNewTask}
          className="text-accent-ink"
        >
          <RailGlyph icon={SquarePen} />
        </RailButton>
        <RailButton label="Overview" active={overviewActive} onClick={onOverview}>
          <RailGlyph icon={LayoutGrid} />
          {needsYou && (
            <span className="absolute top-[7px] right-[7px] size-1.5 rounded-full bg-orange" />
          )}
        </RailButton>
        <span className="mt-3 mb-2.5 h-px w-5 bg-line-tree" />
        {workspaces.map((workspace) => (
          <RailButton
            key={workspace.id}
            label={workspace.name}
            hovered={workspace.id === peek?.id}
            onClick={() => {
              dismiss();
              onOpenWorkspace?.(workspace.id);
            }}
            onMouseEnter={(event) => openPeek(workspace.id, event.currentTarget)}
            onMouseLeave={close}
            className="mt-1"
          >
            <Monogram
              size="md"
              color={workspace.color}
              image={workspace.image}
              icon={workspace.icon}
              className={
                !activeWorkspaceId || workspace.id === activeWorkspaceId ? undefined : "opacity-50"
              }
            >
              {workspace.name[0]}
            </Monogram>
          </RailButton>
        ))}
      </GlideMenu>
      {peeked && peek && (
        <WorkspacePeek
          key={peeked.id}
          workspace={peeked}
          activeTaskId={activeTaskId}
          onSelectTask={(id) => {
            dismiss();
            onSelectTask?.(id);
          }}
          onMouseEnter={keep}
          onMouseLeave={close}
          className="absolute left-[60px] z-30"
          style={{ top: peek.top }}
        />
      )}
      <div className="mt-auto flex w-full justify-center border-t border-line pt-2.5 pb-3">
        <RailButton
          label={`Add workspace, ${shortcutLabel("workspace")}`}
          onClick={onAddWorkspace}
          className="text-ink-3"
        >
          <RailGlyph icon={Plus} size={14} />
        </RailButton>
      </div>
    </aside>
  );
}
