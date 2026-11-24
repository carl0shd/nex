import { FolderGit2, Globe, Package, Trash2 } from "lucide-react";
import { AppleMark } from "@/components/atoms/brand-icons";
import { Button } from "@/components/atoms/button";
import { ModalCard, ModalConsequence, StatusIcon } from "@/components/primitives/modal-card";

const containersDetail = (count: number) =>
  count === 0
    ? "Their containers and data"
    : `${count} ${count === 1 ? "container" : "containers"} and their data`;

export function RemoveEnvironmentsDialog({
  containers,
  removesRuntime,
  removing = false,
  onCancel,
  onRemove,
}: {
  containers: number;
  removesRuntime: boolean;
  removing?: boolean;
  onCancel?: () => void;
  onRemove?: () => void;
}) {
  return (
    <ModalCard
      title="Remove environments?"
      description="Nex deletes the environments it created and asks for your password once to remove its .nex addresses. You can set environments up again from Settings."
      icon={<StatusIcon tone="red" icon={Trash2} />}
      onClose={onCancel}
      footer={
        <>
          <span className="ml-auto" />
          <Button onClick={onCancel}>Cancel</Button>
          <Button variant="danger" disabled={removing} onClick={onRemove}>
            {removing ? "Removing…" : "Remove environments"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col">
        <ModalConsequence
          icon={Package}
          title="Environments"
          detail={containersDetail(containers)}
          outcome="Deleted"
          warn
        />
        <ModalConsequence
          icon={Globe}
          title=".nex addresses"
          detail="Registered on this Mac"
          outcome="Removed"
        />
        <ModalConsequence
          icon={AppleMark}
          title="Apple container"
          detail={
            removesRuntime ? "Nex installed it, so it goes too" : "You had it before Nex set up"
          }
          outcome={removesRuntime ? "Uninstalled" : "Stays installed"}
        />
        <ModalConsequence
          icon={FolderGit2}
          title="Projects"
          detail="Folders, worktrees and branches"
          outcome="Untouched"
        />
      </div>
    </ModalCard>
  );
}
