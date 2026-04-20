import { useMemo, useState } from 'react';
import SimpleBar from 'simplebar-react';
import { Archive, ArchiveRestore, Ellipsis, Plus, Search, Settings, Trash2 } from 'lucide-react';
import { Modal, ModalDivider, ModalFooter, ModalButton } from '@/components/ui/modal';
import Input from '@/components/ui/input';
import IconButton from '@/components/ui/icon-button';
import WorkspaceBadge from '@/components/ui/workspace-badge';
import ContextMenu from '@/components/ui/context-menu';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useSessionStore } from '@/stores/session.store';
import { useSidebarStore } from '@/stores/sidebar.store';
import type { Workspace } from '@native/db/types';

interface ManageWorkspacesModalProps {
  open: boolean;
  onClose: () => void;
}

function WorkspaceRow({
  workspace,
  projectCount,
  taskCount,
  archived
}: {
  workspace: Workspace;
  projectCount: number;
  taskCount: number;
  archived?: boolean;
}): React.JSX.Element {
  const updateWorkspace = useWorkspaceStore((s) => s.updateWorkspace);
  const openEditWorkspace = useSidebarStore((s) => s.openEditWorkspace);
  const openDeleteWorkspace = useSidebarStore((s) => s.openDeleteWorkspace);

  const stats = archived
    ? `${projectCount} ${projectCount === 1 ? 'project' : 'projects'} · archived`
    : `${projectCount} ${projectCount === 1 ? 'project' : 'projects'}${taskCount > 0 ? ` · ${taskCount} active ${taskCount === 1 ? 'task' : 'tasks'}` : ''}`;

  return (
    <div className={`flex items-center gap-3 rounded-md px-3 py-2 ${archived ? 'opacity-50' : ''}`}>
      <WorkspaceBadge
        name={workspace.name}
        color={archived ? 'var(--nex-archived)' : workspace.color}
        icon={workspace.icon}
        customImage={workspace.customImage}
        size={28}
        fontSize={13}
        rounded="rounded-md"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[13px] font-medium text-text">{workspace.name}</span>
        <span className="text-[11px] text-text-muted">{stats}</span>
      </div>
      <div className="flex items-center gap-1">
        {archived ? (
          <>
            <IconButton
              icon={ArchiveRestore}
              size={13}
              onClick={() => updateWorkspace(workspace.id, { archived: false })}
            />
            <IconButton icon={Trash2} size={13} onClick={() => openDeleteWorkspace(workspace.id)} />
          </>
        ) : (
          <>
            <IconButton
              icon={Archive}
              size={13}
              onClick={() => updateWorkspace(workspace.id, { archived: true })}
            />
            <ContextMenu
              trigger={<IconButton icon={Ellipsis} size={13} />}
              actions={[
                {
                  label: 'Edit workspace',
                  icon: Settings,
                  onClick: () => openEditWorkspace(workspace.id)
                },
                {
                  label: 'Archive workspace',
                  icon: Archive,
                  onClick: () => updateWorkspace(workspace.id, { archived: true })
                },
                {
                  label: 'Delete workspace',
                  icon: Trash2,
                  onClick: () => openDeleteWorkspace(workspace.id),
                  destructive: true
                }
              ]}
            />
          </>
        )}
      </div>
    </div>
  );
}

function ManageWorkspacesModal({ open, onClose }: ManageWorkspacesModalProps): React.JSX.Element {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const projects = useWorkspaceStore((s) => s.projects);
  const sessions = useSessionStore((s) => s.sessions);
  const openCreateWorkspace = useSidebarStore((s) => s.openCreateWorkspace);

  const [search, setSearch] = useState('');

  const activeWorkspaces = workspaces.filter(
    (ws) => !ws.archived && ws.name.toLowerCase().includes(search.toLowerCase())
  );
  const archivedWorkspaces = workspaces.filter(
    (ws) => ws.archived && ws.name.toLowerCase().includes(search.toLowerCase())
  );

  const statsMap = useMemo(() => {
    const map = new Map<string, { projectCount: number; taskCount: number }>();
    const projectsByWs = new Map<string, string[]>();
    for (const p of projects) {
      const list = projectsByWs.get(p.workspaceId);
      if (list) list.push(p.id);
      else projectsByWs.set(p.workspaceId, [p.id]);
    }
    const tasksByProject = new Map<string, number>();
    for (const s of sessions) {
      if (s.status !== 'active') continue;
      tasksByProject.set(s.projectId, (tasksByProject.get(s.projectId) ?? 0) + 1);
    }
    for (const ws of workspaces) {
      const wsProjectIds = projectsByWs.get(ws.id) ?? [];
      const taskCount = wsProjectIds.reduce((sum, pid) => sum + (tasksByProject.get(pid) ?? 0), 0);
      map.set(ws.id, { projectCount: wsProjectIds.length, taskCount });
    }
    return map;
  }, [workspaces, projects, sessions]);

  return (
    <Modal open={open} onClose={onClose} width={620}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-text">Manage Workspaces</h2>
          <p className="text-[13px] text-text-secondary">
            View, edit and organize all your workspaces
          </p>
        </div>

        <Input
          value={search}
          onChange={setSearch}
          placeholder="Search workspaces..."
          icon={Search}
        />
      </div>

      <ModalDivider />

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium text-text-muted">{'// active'}</span>
          <span className="rounded-full bg-border px-1.5 py-px text-[10px] font-medium text-text-secondary">
            {activeWorkspaces.length}
          </span>
        </div>

        <SimpleBar style={{ maxHeight: 208 }} autoHide={false}>
          <div className="flex flex-col gap-0.5">
            {activeWorkspaces.map((ws) => (
              <WorkspaceRow
                key={ws.id}
                workspace={ws}
                projectCount={statsMap.get(ws.id)?.projectCount ?? 0}
                taskCount={statsMap.get(ws.id)?.taskCount ?? 0}
              />
            ))}
            {activeWorkspaces.length === 0 && (
              <span className="py-4 text-center text-[13px] text-text-muted">
                No active workspaces
              </span>
            )}
          </div>
        </SimpleBar>

        {archivedWorkspaces.length > 0 && (
          <>
            <ModalDivider />

            <div className="flex items-center gap-1.5">
              <Archive size={12} className="text-text-muted" />
              <span className="text-[10px] font-medium text-text-muted">{'// archived'}</span>
              <span className="rounded-full bg-border px-1.5 py-px text-[10px] font-medium text-text-muted">
                {archivedWorkspaces.length}
              </span>
            </div>

            <SimpleBar style={{ maxHeight: 144 }} autoHide={false}>
              <div className="flex flex-col gap-0.5">
                {archivedWorkspaces.map((ws) => (
                  <WorkspaceRow
                    key={ws.id}
                    workspace={ws}
                    projectCount={statsMap.get(ws.id)?.projectCount ?? 0}
                    taskCount={statsMap.get(ws.id)?.taskCount ?? 0}
                    archived
                  />
                ))}
              </div>
            </SimpleBar>
          </>
        )}
      </div>

      <ModalDivider />

      <ModalFooter>
        <ModalButton variant="ghost" onClick={onClose}>
          close
        </ModalButton>
        <ModalButton onClick={openCreateWorkspace}>
          <Plus size={14} />
          new workspace
        </ModalButton>
      </ModalFooter>
    </Modal>
  );
}

export default ManageWorkspacesModal;
