import { ChevronRight, Folder, GitBranch, Plus } from "lucide-react";
import { Monogram } from "@/components/atoms/entity-chip";
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
  image?: string;
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
        <span className="truncate font-mono text-2xs text-ink-4">{project.path}</span>
      </span>
      <span className="flex h-5 max-w-[160px] shrink-0 items-center gap-1 rounded-chip px-1.5 font-mono text-3xs text-ink-3 shadow-[inset_0_0_0_1px_var(--line-strong)]">
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
}: {
  workspace: SettingsWorkspace;
  onOpenProject?: (id: string) => void;
  onAddProject?: () => void;
}) {
  return (
    <div className="rounded-panel bg-surface p-1.5 shadow-card">
      <div className="flex h-11 items-center gap-2.5 pr-1 pl-2">
        <Monogram
          size="md"
          className="size-[26px] shrink-0 rounded-[7px]"
          color={workspace.color}
          image={workspace.image}
        >
          {workspace.name[0]}
        </Monogram>
        <span className="truncate text-sm font-semibold text-ink" title={workspace.name}>
          {workspace.name}
        </span>
        <span className="shrink-0 text-xs text-ink-4">
          {count(workspace.projects.length, "project")}
        </span>
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
