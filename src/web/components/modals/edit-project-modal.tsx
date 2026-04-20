import { useState, useEffect } from 'react';
import { Folder, GitBranch } from 'lucide-react';
import { Modal, ModalHeader, ModalDivider, ModalFooter, ModalButton } from '@/components/ui/modal';
import Input from '@/components/ui/input';
import FolderPicker from '@/components/ui/folder-picker';
import QuickCommandList from '@/components/ui/quick-command-list';
import Callout from '@/components/ui/callout';
import { useWorkspaceStore } from '@/stores/workspace.store';
import type { Project, QuickCommand } from '@native/db/types';

interface EditProjectFormProps {
  project: Project;
  onClose: () => void;
}

function EditProjectForm({ project, onClose }: EditProjectFormProps): React.JSX.Element {
  const updateProject = useWorkspaceStore((s) => s.updateProject);

  const [name, setName] = useState(project.name);
  const [path, setPath] = useState(project.path);
  const [branchPrefix, setBranchPrefix] = useState(project.branchPrefix);
  const [quickCommands, setQuickCommands] = useState<QuickCommand[]>(project.quickCommands);
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
  const canSave = name.trim().length > 0 && path.trim().length > 0 && !saving;

  const handleBrowse = async (): Promise<void> => {
    const dir = await window.api.pickDirectory();
    if (dir) setPath(dir);
  };

  const handleSave = async (): Promise<void> => {
    if (!canSave) return;
    setSaving(true);

    const validCommands = quickCommands.filter((cmd) => cmd.name.trim() && cmd.command.trim());

    await updateProject(project.id, {
      name: name.trim(),
      path: path.trim(),
      branchPrefix: branchPrefix.trim(),
      quickCommands: validCommands
    });

    onClose();
  };

  return (
    <>
      <ModalHeader title="Edit Project" subtitle={`Update settings for "${project.name}"`} />

      <ModalDivider />

      <div className="flex flex-col gap-3.5">
        <Input
          value={name}
          onChange={setName}
          placeholder="project-name"
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
        <ModalButton onClick={handleSave} disabled={!canSave}>
          save changes
        </ModalButton>
      </ModalFooter>
    </>
  );
}

interface EditProjectModalProps {
  open: boolean;
  projectId: string;
  onClose: () => void;
}

function EditProjectModal({ open, projectId, onClose }: EditProjectModalProps): React.JSX.Element {
  const projects = useWorkspaceStore((s) => s.projects);
  const project = projects.find((p) => p.id === projectId);

  return (
    <Modal width={460} open={open} onClose={onClose}>
      {project && (
        <EditProjectForm key={`${projectId}-${open}`} project={project} onClose={onClose} />
      )}
    </Modal>
  );
}

export default EditProjectModal;
