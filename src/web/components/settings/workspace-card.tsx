import { Folder, GitBranch, MoreHoriz, NavArrowRight, Plus } from "iconoir-react";
import { Monogram } from "@/components/atoms/entity-chip";
import { IconButton } from "@/components/atoms/icon-button";
import GlideMenu from "@/components/primitives/glide-menu";

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
        <span className="text-sm font-medium text-ink">{project.name}</span>
        <span className="truncate font-mono text-2xs text-ink-4">{project.path}</span>
      </span>
      <span className="flex h-5 items-center gap-1 rounded-chip px-1.5 font-mono text-3xs text-ink-3 shadow-[inset_0_0_0_1px_var(--line-strong)]">
        <GitBranch width={10} height={10} strokeWidth={2} />
        {project.branch}
      </span>
      <span className="w-12 text-right text-2xs text-ink-4">{count(project.tasks, "task")}</span>
      <NavArrowRight width={13} height={13} strokeWidth={2} className="text-ink-4" />
    </button>
  );
}

export function WorkspaceCard({
  workspace,
  onOpenProject,
  onAddProject,
}: {
  workspace: SettingsWorkspace;
  onOpenProject?: (id: string) => void;
  onAddProject?: () => void;
}) {
  return (
    <div className="rounded-panel bg-surface p-1.5 shadow-card">
      <div className="flex h-11 items-center gap-2.5 pr-1 pl-2">
        <Monogram size="md" className="size-[26px] rounded-[7px]" color={workspace.color}>
          {workspace.name[0]}
        </Monogram>
        <span className="text-sm font-semibold text-ink">{workspace.name}</span>
        <span className="text-xs text-ink-4">{count(workspace.projects.length, "project")}</span>
        <IconButton aria-label={`${workspace.name} actions`} size="sm" className="ml-auto">
          <MoreHoriz width={14} height={14} strokeWidth={2} />
        </IconButton>
      </div>
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
