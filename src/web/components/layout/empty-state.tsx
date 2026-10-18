import { Plus } from 'lucide-react';
import nexLogo from '@/assets/images/logo.svg';
import { Button } from '@/components/ui/button';
import ShortcutKey from '@/components/ui/shortcut-key';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useSidebarStore } from '@/stores/sidebar.store';

function EmptyState(): React.JSX.Element {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const projects = useWorkspaceStore((s) => s.projects);
  const openCreateWorkspace = useSidebarStore((s) => s.openCreateWorkspace);
  const openCreateProject = useSidebarStore((s) => s.openCreateProject);
  const openCreateTask = useSidebarStore((s) => s.openCreateTask);

  const hasWorkspaces = workspaces.length > 0;
  const hasProjects = projects.length > 0;

  const ctaLabel = !hasWorkspaces ? 'New workspace' : !hasProjects ? 'New project' : 'New task';
  const ctaSubtitle = !hasWorkspaces
    ? 'Create a workspace to get started.'
    : !hasProjects
      ? 'Add a project to your workspace.'
      : 'Start a task to spin up a worktree and its agents.';
  const ctaAction = !hasWorkspaces
    ? openCreateWorkspace
    : !hasProjects
      ? () => openCreateProject(workspaces[0].id)
      : () => openCreateTask();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
      <div className="glass flex size-16 animate-rise items-center justify-center rounded-window">
        <img src={nexLogo} alt="Nex" className="w-7" draggable={false} />
      </div>

      <div className="flex animate-rise flex-col items-center gap-1.5 text-center [animation-delay:60ms]">
        <h2 className="text-2xl font-medium text-ink">No active worktrees</h2>
        <p className="text-sm text-ink-3">{ctaSubtitle}</p>
      </div>

      <Button size="lg" onClick={ctaAction} className="animate-rise px-5 [animation-delay:120ms]">
        <Plus size={15} strokeWidth={2.25} />
        {ctaLabel}
      </Button>

      <div className="flex animate-rise items-center gap-5 [animation-delay:180ms]">
        <ShortcutKey keys="⌘W" label="New workspace" />
        <ShortcutKey keys="⌘P" label="New project" />
        <ShortcutKey keys="⌘T" label="New task" />
      </div>
    </div>
  );
}

export default EmptyState;
