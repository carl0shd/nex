import { useState, useMemo, useEffect } from 'react';
import { Folder, GitBranch } from 'lucide-react';
import { Modal, ModalHeader, ModalDivider, ModalFooter, ModalButton } from '@/components/ui/modal';
import Input from '@/components/ui/input';
import Dropdown from '@/components/ui/dropdown';
import FolderPicker from '@/components/ui/folder-picker';
import QuickCommandList from '@/components/ui/quick-command-list';
import WorkspaceBadge from '@/components/ui/workspace-badge';
import Callout from '@/components/ui/callout';
import { useWorkspaceStore } from '@/stores/workspace.store';
import type { QuickCommand } from '@native/db/types';

interface ProjectFormProps {
  workspaceId: string;
  onClose: () => void;
}

function ProjectForm({ workspaceId, onClose }: ProjectFormProps): React.JSX.Element {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const createProject = useWorkspaceStore((s) => s.createProject);

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(workspaceId);
  const [name, setName] = useState('');
  const [path, setPath] = useState('');
  const [branchPrefix, setBranchPrefix] = useState('');
  const [quickCommands, setQuickCommands] = useState<QuickCommand[]>([]);
  const [saving, setSaving] = useState(false);
  const [isGitRepo, setIsGitRepo] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    const trimmed = path.trim();
    const run = async (): Promise<void> => {
      if (!trimmed) {
        if (!cancelled) setIsGitRepo(null);
        return;
      }
      const valid = await window.api.isGitRepo(trimmed);
      if (!cancelled) setIsGitRepo(valid);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [path]);

  const gitDisabled = isGitRepo === false;
  const canCreate = name.trim().length > 0 && path.trim().length > 0 && !saving;

  const workspaceOptions = useMemo(
    () =>
      workspaces
        .filter((ws) => !ws.archived)
        .map((ws) => ({
          value: ws.id,
          label: ws.name,
          icon: (
            <WorkspaceBadge
              name={ws.name}
              color={ws.color}
              icon={ws.icon}
              customImage={ws.customImage}
              size={16}
              fontSize={9}
              rounded="rounded-sm"
            />
          )
        })),
    [workspaces]
  );

  const handleBrowse = async (): Promise<void> => {
    const dir = await window.api.pickDirectory();
    if (dir) {
      setPath(dir);
      if (!name) {
        const parts = dir.split('/');
        setName(parts[parts.length - 1]);
      }
    }
  };

  const handleCreate = async (): Promise<void> => {
    if (!canCreate) return;
    setSaving(true);

    const validCommands = quickCommands.filter((cmd) => cmd.name.trim() && cmd.command.trim());

    await createProject({
      workspaceId: selectedWorkspaceId,
      name: name.trim(),
      path: path.trim(),
      branchPrefix: branchPrefix.trim(),
      quickCommands: validCommands
    });

    onClose();
  };

  return (
    <>
      <ModalHeader title="New Project" subtitle="Add a new project to your workspace" />

      <ModalDivider />

      <div className="flex flex-col gap-3.5">
        <Dropdown
          value={selectedWorkspaceId}
          onChange={setSelectedWorkspaceId}
          options={workspaceOptions}
          label="// workspace"
        />

        <Input
          value={name}
          onChange={setName}
          placeholder="new-project-name"
          label="// project name"
          icon={Folder}
        />

        <FolderPicker value={path} onBrowse={handleBrowse} />

        {gitDisabled && (
          <Callout variant="warning">
            This folder is not a valid git repository. Git-based options (branch prefix, worktrees)
            will be unavailable until you run <code className="font-mono">git init</code>.
          </Callout>
        )}

        <Input
          value={branchPrefix}
          onChange={setBranchPrefix}
          placeholder="feature/"
          label="// branch prefix (optional)"
          icon={GitBranch}
          disabled={gitDisabled}
        />

        <ModalDivider />

        <QuickCommandList commands={quickCommands} onChange={setQuickCommands} />
      </div>

      <ModalDivider />

      <ModalFooter>
        <ModalButton variant="ghost" onClick={onClose}>
          cancel
        </ModalButton>
        <ModalButton onClick={handleCreate} disabled={!canCreate}>
          create project
        </ModalButton>
      </ModalFooter>
    </>
  );
}

interface CreateProjectModalProps {
  open: boolean;
  workspaceId: string;
  onClose: () => void;
}

function CreateProjectModal({
  open,
  workspaceId,
  onClose
}: CreateProjectModalProps): React.JSX.Element {
  const [resetCount, setResetCount] = useState(0);
  return (
    <Modal
      width={460}
      open={open}
      onClose={onClose}
      onAfterClose={() => setResetCount((c) => c + 1)}
    >
      <ProjectForm
        key={`${workspaceId}-${resetCount}`}
        workspaceId={workspaceId}
        onClose={onClose}
      />
    </Modal>
  );
}

export default CreateProjectModal;
