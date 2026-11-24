import { useState } from "react";
import {
  ChevronRight,
  Ellipsis,
  Eye,
  EyeOff,
  Folder,
  GitBranch,
  Palette,
  PenLine,
  Plus,
  Trash2,
} from "lucide-react";
import { GithubMark } from "@/components/atoms/brand-icons";
import { Monogram } from "@/components/atoms/entity-chip";
import { IconButton } from "@/components/atoms/icon-button";
import { InlineRename } from "@/components/atoms/inline-rename";
import { AnchoredPopover } from "@/components/primitives/anchored-popover";
import GlideMenu from "@/components/primitives/glide-menu";
import { Menu, MenuItem, MenuSeparator } from "@/components/primitives/menu";
import type { WorkspaceLookChange } from "@/components/sidebar/workspace-header";
import { WorkspaceLook } from "@/components/sidebar/workspace-look";
import type { WorkspaceIconName } from "@/lib/workspace-icons";

export interface SettingsProject {
  id: string;
  name: string;
  path: string;
  branch: string;
  tasks: number;
}

export interface SettingsWorkspace {
  id: string;
  name: string;
  color: string;
  image?: string;
  icon?: WorkspaceIconName;
  hidden: boolean;
  projects: readonly SettingsProject[];
}

const count = (value: number, noun: string) => `${value} ${noun}${value === 1 ? "" : "s"}`;

function ProjectRow({ project, onOpen }: { project: SettingsProject; onOpen?: () => void }) {
  return (
    <button
      type="button"
      data-menu-row
      onClick={onOpen}
      className="interactive press-wide relative flex h-12 w-full cursor-pointer items-center gap-3 rounded-control px-3 text-left select-none"
    >
      <Folder width={14} height={14} strokeWidth={2} className="shrink-0 text-ink-4" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-ink" title={project.name}>
          {project.name}
        </span>
        <span className="truncate text-2xs text-ink-4">{project.path}</span>
      </span>
      <span className="flex h-5 max-w-[160px] shrink-0 items-center gap-1 rounded-chip px-1.5 text-3xs text-ink-3 shadow-[inset_0_0_0_1px_var(--line-strong)]">
        <GitBranch width={10} height={10} strokeWidth={2} className="shrink-0" />
        <span className="truncate" title={project.branch}>
          {project.branch}
        </span>
      </span>
      <span className="w-12 shrink-0 text-right text-2xs text-ink-4">
        {count(project.tasks, "task")}
      </span>
      <ChevronRight width={13} height={13} strokeWidth={2} className="shrink-0 text-ink-4" />
    </button>
  );
}

export function WorkspaceCard({
  workspace,
  onOpenProject,
  onAddProject,
  onImport,
  onRename,
  onLookChange,
  onHiddenChange,
  onRemove,
}: {
  workspace: SettingsWorkspace;
  onOpenProject?: (id: string) => void;
  onAddProject?: () => void;
  onImport?: () => void;
  onRename?: (name: string) => void;
  onLookChange?: (look: WorkspaceLookChange) => void;
  onHiddenChange?: (hidden: boolean) => void;
  onRemove?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [lookOpen, setLookOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const run = (action: () => void) => () => {
    setMenuOpen(false);
    action();
  };

  return (
    <div className="rounded-panel bg-surface p-1.5 shadow-card">
      <AnchoredPopover
        open={lookOpen}
        onOpenChange={setLookOpen}
        side="bottom"
        strategy="fixed"
        trigger={
          <div className="flex h-11 w-full items-center gap-2.5 pr-1 pl-2">
            <Monogram
              size="md"
              className="size-[26px] shrink-0 rounded-[7px]"
              color={workspace.color}
              image={workspace.image}
              icon={workspace.icon}
            >
              {workspace.name[0]}
            </Monogram>
            {renaming ? (
              <InlineRename
                label="Workspace name"
                name={workspace.name}
                onDone={(name) => {
                  setRenaming(false);
                  if (name) onRename?.(name);
                }}
              />
            ) : (
              <>
                <span className="truncate text-sm font-semibold text-ink" title={workspace.name}>
                  {workspace.name}
                </span>
                <span className="shrink-0 text-xs text-ink-4">
                  {count(workspace.projects.length, "project")}
                  {workspace.hidden && " · hidden"}
                </span>
              </>
            )}
            <AnchoredPopover
              open={menuOpen}
              onOpenChange={setMenuOpen}
              align="end"
              side="bottom"
              strategy="fixed"
              className="ml-auto shrink-0"
              trigger={
                <IconButton
                  size="sm"
                  aria-label={`${workspace.name} actions`}
                  aria-expanded={menuOpen}
                  pressed={menuOpen}
                  onClick={() => setMenuOpen((open) => !open)}
                >
                  <Ellipsis width={14} height={14} strokeWidth={2.25} />
                </IconButton>
              }
            >
              <Menu width={210}>
                {onImport && (
                  <MenuItem icon={GithubMark} onSelect={run(onImport)}>
                    Import from GitHub
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
                {onHiddenChange &&
                  (workspace.hidden ? (
                    <MenuItem icon={Eye} onSelect={run(() => onHiddenChange(false))}>
                      Show workspace
                    </MenuItem>
                  ) : (
                    <MenuItem icon={EyeOff} onSelect={run(() => onHiddenChange(true))}>
                      Hide workspace
                    </MenuItem>
                  ))}
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
          </div>
        }
      >
        <WorkspaceLook
          color={workspace.color}
          hasImage={Boolean(workspace.image)}
          icon={workspace.icon}
          onColorChange={(color) => onLookChange?.({ color })}
          onBadgeChange={(badge) => onLookChange?.(badge)}
        />
      </AnchoredPopover>
      <div className="rounded-field bg-inset p-1 shadow-[inset_0_0_0_1px_var(--line-soft)]">
        <GlideMenu className="flex flex-col">
          {workspace.projects.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              onOpen={() => onOpenProject?.(project.id)}
            />
          ))}
          <button
            type="button"
            data-menu-row
            onClick={onAddProject}
            className="interactive press-wide relative flex h-9 w-full cursor-pointer items-center gap-3 rounded-control px-3 text-left text-sm text-ink-3 select-none hover:text-ink"
          >
            <Plus width={13} height={13} strokeWidth={2} />
            Add project
          </button>
        </GlideMenu>
      </div>
    </div>
  );
}
