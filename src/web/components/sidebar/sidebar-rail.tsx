import type { ComponentType, ReactNode } from "react";
import { EditPencil, Plus, ViewGrid } from "iconoir-react";
import { Monogram } from "@/components/atoms/entity-chip";
import GlideMenu from "@/components/primitives/glide-menu";
import { cn } from "@/lib/utils";
import type { SidebarWorkspace } from "@/components/sidebar/types";

type RailIcon = ComponentType<{ width?: number; height?: number; strokeWidth?: number }>;

function RailButton({
  label,
  active = false,
  hovered = false,
  className,
  children,
}: {
  label: string;
  active?: boolean;
  hovered?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
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

export function SidebarRail({
  workspaces,
  activeWorkspaceId,
  hoveredWorkspaceId,
  needsYou = false,
}: {
  workspaces: SidebarWorkspace[];
  activeWorkspaceId: string;
  hoveredWorkspaceId?: string;
  needsYou?: boolean;
}) {
  return (
    <aside aria-label="Navigation" className="flex w-[52px] shrink-0 flex-col bg-page pt-1.5">
      <GlideMenu
        className="flex flex-col items-center gap-0.5"
        highlightClassName="left-1/2 w-9 -translate-x-1/2 rounded-[9px] bg-hover"
      >
        <RailButton label="New task, ⌘T" className="text-accent-ink">
          <RailGlyph icon={EditPencil} />
        </RailButton>
        <RailButton label="Overview" active>
          <RailGlyph icon={ViewGrid} />
          {needsYou && (
            <span className="absolute top-[7px] right-[7px] size-1.5 rounded-full bg-orange" />
          )}
        </RailButton>
        <span className="mt-3 mb-2.5 h-px w-5 bg-line-tree" />
        {workspaces.map((workspace) => (
          <RailButton
            key={workspace.id}
            label={workspace.name}
            hovered={workspace.id === hoveredWorkspaceId}
            className="mt-1"
          >
            <Monogram
              size="md"
              color={workspace.color}
              className={workspace.id === activeWorkspaceId ? undefined : "opacity-50"}
            >
              {workspace.name[0]}
            </Monogram>
          </RailButton>
        ))}
      </GlideMenu>
      <div className="mt-auto flex w-full justify-center border-t border-line pt-2.5 pb-3">
        <RailButton label="Add workspace, ⌘⇧N" className="text-ink-3">
          <RailGlyph icon={Plus} size={14} />
        </RailButton>
      </div>
    </aside>
  );
}
