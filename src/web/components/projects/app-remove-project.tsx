import { useState } from "react";
import { Overlay } from "@/components/primitives/overlay";
import { RemoveProjectDialog } from "@/components/projects/remove-project-dialog";
import { notifyCompact } from "@/lib/notify";
import { useRemoveProjectStore } from "@/stores/remove-project.store";
import { useWorkspaceStore } from "@/stores/workspace.store";

export function AppRemoveProject() {
  const projectId = useRemoveProjectStore((s) => s.projectId);
  const hide = useRemoveProjectStore((s) => s.hide);
  const project = useWorkspaceStore((s) => s.projects.find((item) => item.id === projectId));
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const sessions = useWorkspaceStore((s) => s.sessions);
  const removeProject = useWorkspaceStore((s) => s.removeProject);
  const [removing, setRemoving] = useState(false);
  if (!project) return null;

  const remove = async () => {
    setRemoving(true);
    try {
      await removeProject(project.id);
      notifyCompact({ tone: "neutral", title: `${project.name} removed` });
    } catch {
      notifyCompact({ tone: "red", title: `Couldn’t remove ${project.name}` });
    } finally {
      setRemoving(false);
      hide();
    }
  };

  return (
    <Overlay onClose={hide}>
      <RemoveProjectDialog
        project={{
          name: project.name,
          workspace: workspaces.find((item) => item.id === project.workspaceId)?.name ?? "",
          tasks: sessions.filter(
            (session) => session.projectId === project.id && session.status !== "done",
          ).length,
        }}
        removing={removing}
        onCancel={hide}
        onRemove={() => void remove()}
      />
    </Overlay>
  );
}
