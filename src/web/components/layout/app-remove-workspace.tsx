import { useState } from "react";
import { Overlay } from "@/components/primitives/overlay";
import { RemoveWorkspaceDialog } from "@/components/sidebar/remove-workspace-dialog";
import { notifyCompact } from "@/lib/notify";
import { useRemoveWorkspaceStore } from "@/stores/remove-workspace.store";
import { useWorkspaceStore } from "@/stores/workspace.store";

export function AppRemoveWorkspace() {
  const workspaceId = useRemoveWorkspaceStore((s) => s.workspaceId);
  const hide = useRemoveWorkspaceStore((s) => s.hide);
  const workspace = useWorkspaceStore((s) => s.workspaces.find((item) => item.id === workspaceId));
  const projects = useWorkspaceStore((s) => s.projects);
  const sessions = useWorkspaceStore((s) => s.sessions);
  const removeWorkspace = useWorkspaceStore((s) => s.removeWorkspace);
  const [removing, setRemoving] = useState(false);
  if (!workspace) return null;

  const projectIds = new Set(
    projects.filter((project) => project.workspaceId === workspace.id).map((project) => project.id),
  );

  const remove = async () => {
    setRemoving(true);
    try {
      await removeWorkspace(workspace.id);
      notifyCompact({ tone: "neutral", title: `${workspace.name} removed` });
    } catch {
      notifyCompact({ tone: "red", title: `Couldn’t remove ${workspace.name}` });
    } finally {
      setRemoving(false);
      hide();
    }
  };

  return (
    <Overlay onClose={hide}>
      <RemoveWorkspaceDialog
        workspace={{
          name: workspace.name,
          projects: projectIds.size,
          tasks: sessions.filter(
            (session) => projectIds.has(session.projectId) && session.status !== "done",
          ).length,
        }}
        removing={removing}
        onCancel={hide}
        onRemove={() => void remove()}
      />
    </Overlay>
  );
}
