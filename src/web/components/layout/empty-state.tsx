import nexLogo from '@/assets/images/logo.svg';
import ShortcutKey from '@/components/ui/shortcut-key';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useSidebarStore } from '@/stores/sidebar.store';

function EmptyState(): React.JSX.Element {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const projects = useWorkspaceStore((s) => s.projects);
  const openCreateWorkspace = useSidebarStore((s) => s.openCreateWorkspace);
  const openCreateProject = useSidebarStore((s) => s.openCreateProject);

  const hasWorkspaces = workspaces.length > 0;
  const hasProjects = projects.length > 0;

  const ctaLabel = !hasWorkspaces ? 'new workspace' : !hasProjects ? 'new project' : 'new task';
  const ctaSubtitle = !hasWorkspaces
    ? 'Create a workspace to get started'
    : !hasProjects
      ? 'Add a project to your workspace'
      : 'Create a new task to start working';
  const ctaAction = !hasWorkspaces
    ? openCreateWorkspace
    : !hasProjects
      ? () => openCreateProject(workspaces[0].id)
      : undefined;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-bg">
      <img src={nexLogo} alt="Nex" className="w-12 pb-10" draggable={false} />

      <div className="flex flex-col items-center gap-2">
        <h2 className="text-lg font-medium text-text">No active worktrees</h2>
        <p className="text-sm text-text-secondary">{ctaSubtitle}</p>
      </div>

      <button
        onClick={ctaAction}
        className="cursor-pointer rounded bg-accent px-6 py-2.5 text-sm font-medium text-text select-none hover:bg-accent-hover"
      >
        &gt; {ctaLabel}
      </button>

      <div className="flex flex-col gap-2">
        <ShortcutKey keys="⌘W" label="new workspace" />
        <ShortcutKey keys="⌘P" label="new project" />
        <ShortcutKey keys="⌘T" label="new task" />
      </div>
    </div>
  );
}

export default EmptyState;
