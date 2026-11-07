import { useState } from "react";
import { WorkspaceStep, type WorkspaceDraft } from "@/components/onboarding/workspace-step";
import { notifyCompact } from "@/lib/notify";
import { workspaceIcon } from "@/lib/workspace-icons";
import { useWorkspaceStore } from "@/stores/workspace.store";

const DEFAULT_COLOR = "#33843F";

export function AppWorkspaceStep({
  workspaceId,
  onBack,
  onContinue,
}: {
  workspaceId: string | null;
  onBack: () => void;
  onContinue: (workspaceId: string) => void;
}) {
  const existing = useWorkspaceStore((s) => s.workspaces.find((item) => item.id === workspaceId));
  const createWorkspace = useWorkspaceStore((s) => s.createWorkspace);
  const renameWorkspace = useWorkspaceStore((s) => s.renameWorkspace);
  const setWorkspaceLook = useWorkspaceStore((s) => s.setWorkspaceLook);
  const [draft, setDraft] = useState<WorkspaceDraft>(() => ({
    name: existing?.name ?? "",
    color: existing?.color ?? DEFAULT_COLOR,
    image: null,
    icon: workspaceIcon(existing?.icon) ?? null,
  }));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      if (existing) {
        if (draft.name.trim() !== existing.name)
          await renameWorkspace(existing.id, draft.name.trim());
        await setWorkspaceLook(existing.id, {
          color: draft.color,
          ...(draft.image && { image: draft.image }),
          ...((draft.icon ?? null) !== (workspaceIcon(existing.icon) ?? null) && {
            icon: draft.icon ?? null,
          }),
        });
        onContinue(existing.id);
      } else {
        const workspace = await createWorkspace({ ...draft, name: draft.name.trim() });
        onContinue(workspace.id);
      }
    } catch {
      setSaving(false);
      notifyCompact({ tone: "red", title: `Couldn’t create ${draft.name.trim()}` });
    }
  };

  return (
    <WorkspaceStep
      workspace={draft}
      onChange={setDraft}
      saving={saving}
      onBack={onBack}
      onContinue={() => void save()}
    />
  );
}
