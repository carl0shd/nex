import { HomePrompt } from "@/components/home/home-prompt";
import type { NewTaskLauncher } from "@/hooks/use-new-task-launcher";
import { useAddProjectStore } from "@/stores/add-project.store";
import { useNewWorkspaceStore } from "@/stores/new-workspace.store";
import { useWorkspaceStore } from "@/stores/workspace.store";

export function AppHomePrompt({ launcher }: { launcher: NewTaskLauncher }) {
  const firstWorkspace = useWorkspaceStore((s) => s.workspaces.find((item) => !item.archived)?.id);
  const showAddProject = useAddProjectStore((s) => s.show);
  const showNewWorkspace = useNewWorkspaceStore((s) => s.show);
  return (
    <HomePrompt
      projects={launcher.projects}
      agents={launcher.agents}
      models={launcher.models}
      defaults={launcher.defaults}
      starting={launcher.starting}
      autoFocus
      onStart={launcher.start}
      onAddProject={() => (firstWorkspace ? showAddProject(firstWorkspace) : showNewWorkspace())}
    />
  );
}
