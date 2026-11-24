import { useEffect } from "react";
import { NewTaskDialog } from "@/components/new-task/new-task-dialog";
import { useAppHotkey } from "@/hooks/use-app-hotkey";
import { useClaudeSessions } from "@/hooks/use-claude-sessions";
import { useNewTaskLauncher } from "@/hooks/use-new-task-launcher";
import { notifyCompact } from "@/lib/notify";
import { useNewTaskStore } from "@/stores/new-task.store";
import { useWorkspaceStore } from "@/stores/workspace.store";

function NewTaskLoader({ projectId, onClose }: { projectId: string | null; onClose: () => void }) {
  const launcher = useNewTaskLauncher(onClose);
  const startProject =
    launcher?.projects.find((project) => project.id === projectId) ?? launcher?.projects[0];
  // The chat pill sets the dialog's width, so it opens once that project's chats are known.
  const chats = useClaudeSessions(startProject?.id);
  if (!launcher || !chats) return null;
  return (
    <NewTaskDialog
      projects={launcher.projects}
      agents={launcher.agents}
      defaultProject={projectId ?? undefined}
      models={launcher.models}
      defaults={launcher.defaults}
      starting={launcher.starting}
      onStart={(draft) => void launcher.start(draft)}
      onClose={onClose}
    />
  );
}

export function AppNewTask() {
  const open = useNewTaskStore((s) => s.open);
  const projectId = useNewTaskStore((s) => s.projectId);
  const show = useNewTaskStore((s) => s.show);
  const hide = useNewTaskStore((s) => s.hide);
  const hasProjects = useWorkspaceStore((s) =>
    s.projects.some((project) =>
      s.workspaces.some((workspace) => workspace.id === project.workspaceId && !workspace.archived),
    ),
  );

  useEffect(() => {
    if (!open || hasProjects) return;
    hide();
    notifyCompact({ tone: "neutral", title: "Add a project first" });
  }, [open, hasProjects, hide]);

  useAppHotkey("new-task", () => show());

  return open && hasProjects ? (
    <NewTaskLoader key={projectId ?? "any"} projectId={projectId} onClose={hide} />
  ) : null;
}
