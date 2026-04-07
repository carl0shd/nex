import { useState, useMemo } from 'react';
import { Modal, ModalHeader, ModalDivider, ModalFooter, ModalButton } from '@/components/ui/modal';
import Input from '@/components/ui/input';
import ColorPicker from '@/components/ui/color-picker';
import IconSelector from '@/components/ui/icon-selector';
import { getWorkspaceIconOptions } from '@/lib/workspace-icons';
import WorkspaceBadge from '@/components/ui/workspace-badge';
import { useWorkspaceStore } from '@/stores/workspace.store';
import type { Workspace } from '@native/db/types';

interface WorkspaceFormProps {
  existing: Workspace | null;
  onClose: () => void;
}

function WorkspaceForm({ existing, onClose }: WorkspaceFormProps): React.JSX.Element {
  const createWorkspace = useWorkspaceStore((s) => s.createWorkspace);
  const updateWorkspace = useWorkspaceStore((s) => s.updateWorkspace);
  const projects = useWorkspaceStore((s) => s.projects);

  const isEditing = !!existing;
  const [name, setName] = useState(existing?.name ?? '');
  const [color, setColor] = useState(existing?.color ?? '#175F52');
  const [icon, setIcon] = useState(existing?.icon ?? 'letter');
  const [customImage, setCustomImage] = useState<string | null>(existing?.customImage ?? null);
  const [saving, setSaving] = useState(false);

  const initial = name.trim() ? name.trim()[0].toUpperCase() : 'W';
  const canSave = name.trim().length > 0 && !saving;
  const isCustomImage = icon === 'custom' && !!customImage;

  const iconOptions = useMemo(() => getWorkspaceIconOptions(initial), [initial]);
  const projectCount = isEditing ? projects.filter((p) => p.workspaceId === existing.id).length : 0;

  const handlePickImage = async (): Promise<void> => {
    const dataUrl = await window.api.pickImage();
    if (dataUrl) {
      setCustomImage(dataUrl);
      setIcon('custom');
    }
  };

  const handleSave = async (): Promise<void> => {
    if (!canSave) return;
    setSaving(true);

    if (isEditing) {
      await updateWorkspace(existing.id, { name: name.trim(), color, icon });

      if (icon === 'custom' && customImage && customImage !== existing.customImage) {
        const iconPath = await window.api.saveWorkspaceIcon(existing.id, customImage);
        if (iconPath) {
          await updateWorkspace(existing.id, { customImage: iconPath });
        }
      } else if (icon !== 'custom') {
        await updateWorkspace(existing.id, { customImage: null });
      }
    } else {
      const ws = await createWorkspace({ name: name.trim(), color, icon });

      if (icon === 'custom' && customImage) {
        const iconPath = await window.api.saveWorkspaceIcon(ws.id, customImage);
        if (iconPath) {
          await updateWorkspace(ws.id, { customImage: iconPath });
        }
      }
    }

    onClose();
  };

  return (
    <>
      <ModalHeader
        title={isEditing ? 'Edit Workspace' : 'New Workspace'}
        subtitle={
          isEditing
            ? 'Update your workspace configuration'
            : 'Create a workspace to organize your projects'
        }
      />

      <ModalDivider />

      <div className="flex items-center gap-4">
        <WorkspaceBadge
          name={name.trim() || 'W'}
          color={color}
          icon={icon}
          customImage={customImage}
          size={48}
          fontSize={20}
          iconSize={22}
          rounded="rounded-lg"
        />
        <div className="flex flex-col gap-0.5">
          <span className="max-w-60 truncate text-[14px] font-semibold text-text">
            {name.trim() || 'new-workspace'}
          </span>
          <span className="text-[11px] text-text-muted">
            {isEditing ? `${projectCount} projects` : '0 projects · 0 tasks'}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Input
          value={name}
          onChange={(v) => setName(v.replace(/[^a-zA-Z0-9\s-]/g, ''))}
          placeholder="new-workspace"
          label="// workspace name"
        />

        <ColorPicker
          value={color}
          onChange={setColor}
          label="// background color"
          disabled={isCustomImage}
        />

        <IconSelector
          options={iconOptions}
          value={icon}
          onChange={setIcon}
          onPickImage={handlePickImage}
          label="// icon"
        />
      </div>

      <ModalDivider />

      <ModalFooter>
        <ModalButton variant="ghost" onClick={onClose}>
          cancel
        </ModalButton>
        <ModalButton onClick={handleSave} disabled={!canSave}>
          {isEditing ? 'save changes' : 'create workspace'}
        </ModalButton>
      </ModalFooter>
    </>
  );
}

interface WorkspaceModalProps {
  open: boolean;
  workspaceId?: string;
  onClose: () => void;
}

function WorkspaceModal({ open, workspaceId, onClose }: WorkspaceModalProps): React.JSX.Element {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const existing = workspaceId ? (workspaces.find((ws) => ws.id === workspaceId) ?? null) : null;

  return (
    <Modal open={open} onClose={onClose}>
      <WorkspaceForm key={workspaceId ?? 'new'} existing={existing} onClose={onClose} />
    </Modal>
  );
}

export default WorkspaceModal;
