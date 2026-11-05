import { useState } from "react";
import { ChevronDown, Ellipsis, Palette, PenLine, Plus, Trash2 } from "lucide-react";
import { Monogram } from "@/components/atoms/entity-chip";
import { HoverSwap } from "@/components/atoms/hover-swap";
import { InlineRename } from "@/components/atoms/inline-rename";
import { AnchoredPopover } from "@/components/primitives/anchored-popover";
import { Menu, MenuItem, MenuSeparator } from "@/components/primitives/menu";
import type { SidebarWorkspace } from "@/components/sidebar/types";
import { WorkspaceLook } from "@/components/sidebar/workspace-look";
import { cn } from "@/lib/utils";

export interface WorkspaceLookChange {
  color?: string;
  image?: string | null;
}

export function WorkspaceHeader({
  workspace,
  onToggle,
  onAddProject,
  onRename,
  onLookChange,
  onRemove,
}: {
  workspace: SidebarWorkspace;
  onToggle?: () => void;
  onAddProject?: () => void;
  onRename?: (name: string) => void;
  onLookChange?: (look: WorkspaceLookChange) => void;
  onRemove?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [lookOpen, setLookOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const projectCount = workspace.projects.length;
  const run = (action: () => void) => () => {
    setMenuOpen(false);
    action();
  };

  return (
    <AnchoredPopover
      open={lookOpen}
      onOpenChange={setLookOpen}
      strategy="fixed"
      className="hover-swap-host"
      trigger={
        <div
          onContextMenu={(event) => {
            event.preventDefault();
            setMenuOpen(true);
          }}
          className="flex h-8 w-full items-center gap-1 pr-1.5"
        >
          {renaming ? (
            <span className="flex min-w-0 flex-1 items-center gap-2 pl-2">
              <Monogram color={workspace.color} image={workspace.image}>
                {workspace.name[0]}
              </Monogram>
              <InlineRename
                label="Workspace name"
                name={workspace.name}
                onDone={(name) => {
                  setRenaming(false);
                  if (name) onRename?.(name);
                }}
              />
            </span>
          ) : (
            <button
              type="button"
              onClick={onToggle}
              className="interactive press-wide flex h-8 min-w-0 flex-1 cursor-pointer items-center gap-2 pl-2 select-none"
            >
              <Monogram color={workspace.color} image={workspace.image}>
                {workspace.name[0]}
              </Monogram>
              <span title={workspace.name} className="truncate text-sm font-semibold text-ink">
                {workspace.name}
              </span>
              <ChevronDown
                width={12}
                height={12}
                strokeWidth={2.25}
                className={cn(
                  "shrink-0 text-ink-4 transition-[rotate] duration-200 ease-out-strong",
                  !workspace.expanded && "-rotate-90",
                )}
              />
            </button>
          )}
          {!renaming && (
            <AnchoredPopover
              open={menuOpen}
              onOpenChange={setMenuOpen}
              align="end"
              strategy="fixed"
              trigger={
                <HoverSwap
                  pinned={menuOpen}
                  rest={
                    !workspace.expanded && (
                      <span className="text-2xs whitespace-nowrap text-ink-4">
                        {projectCount} {projectCount === 1 ? "project" : "projects"}
                      </span>
                    )
                  }
                  hover={
                    <button
                      type="button"
                      aria-label={`${workspace.name} actions`}
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
                />
              }
            >
              <Menu width={210}>
                {onAddProject && (
                  <MenuItem icon={Plus} onSelect={run(onAddProject)}>
                    Add a project
                  </MenuItem>
                )}
                {onRename && (
                  <MenuItem icon={PenLine} onSelect={run(() => setRenaming(true))}>
                    Rename
                  </MenuItem>
                )}
                {onLookChange && (
                  <MenuItem icon={Palette} onSelect={run(() => setLookOpen(true))}>
                    Color and badge
                  </MenuItem>
                )}
                {onRemove && (
                  <>
                    <MenuSeparator />
                    <MenuItem icon={Trash2} danger onSelect={run(onRemove)}>
                      Remove workspace
                    </MenuItem>
                  </>
                )}
              </Menu>
            </AnchoredPopover>
          )}
        </div>
      }
    >
      <WorkspaceLook
        color={workspace.color}
        hasImage={Boolean(workspace.image)}
        onColorChange={(color) => onLookChange?.({ color })}
        onImageChange={(image) => onLookChange?.({ image })}
      />
    </AnchoredPopover>
  );
}
