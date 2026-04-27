import { useState, useMemo, useEffect } from 'react';
import { Folder, GitBranch } from 'lucide-react';
import { toast } from 'sonner';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalDivider,
  ModalFooter,
  ModalButton
} from '@/components/ui/modal';
import Input from '@/components/ui/input';
import Dropdown from '@/components/ui/dropdown';
import Textarea from '@/components/ui/textarea';
import Checkbox from '@/components/ui/checkbox';
import AgentCardSelector from '@/components/ui/agent-card-selector';
import WorkspaceBadge from '@/components/ui/workspace-badge';
import Callout from '@/components/ui/callout';
import BranchPicker from '@/components/ui/branch-picker';
import Chip from '@/components/ui/chip';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useAgentStore } from '@/stores/agent.store';
import { useSessionStore } from '@/stores/session.store';
import claudeLogo from '@/assets/images/claude-logo.svg';

const SYMLINK_OPTIONS = ['.env', 'node_modules'] as const;

const GIT_BRANCH_NAME_RE = /^(?!\.)(?!.*\.\.)(?!.*\/\/)(?!.*\/$)(?!.*\.$)[A-Za-z0-9._/-]+$/;
const TASK_NAME_RE = /^[A-Za-z0-9._-]+$/;

function validateName(name: string, requireGitSafe: boolean): string | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  if (requireGitSafe) {
    if (!GIT_BRANCH_NAME_RE.test(trimmed)) {
      return 'Invalid branch name. Use letters, numbers, dashes, underscores, dots or slashes.';
    }
  } else if (!TASK_NAME_RE.test(trimmed)) {
    return 'Invalid task name. Use letters, numbers, dashes, underscores or dots.';
  }
  return null;
}

interface TaskFormProps {
  initialWorkspaceId: string;
  initialProjectId: string;
  onClose: () => void;
}

function TaskForm({
  initialWorkspaceId,
  initialProjectId,
  onClose
}: TaskFormProps): React.JSX.Element {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const projects = useWorkspaceStore((s) => s.projects);
  const agents = useAgentStore((s) => s.agents);
  const accounts = useAgentStore((s) => s.accounts);
  const loadSessions = useSessionStore((s) => s.loadSessions);

  const activeWorkspaces = useMemo(() => workspaces.filter((ws) => !ws.archived), [workspaces]);

  const [workspaceId, setWorkspaceId] = useState(
    initialWorkspaceId || activeWorkspaces[0]?.id || ''
  );

  const workspaceProjects = useMemo(
    () => projects.filter((p) => p.workspaceId === workspaceId),
    [projects, workspaceId]
  );

  const [projectId, setProjectId] = useState(initialProjectId || workspaceProjects[0]?.id || '');

  const handleWorkspaceChange = (id: string): void => {
    setWorkspaceId(id);
    const firstProject = projects.find((p) => p.workspaceId === id);
    setProjectId(firstProject?.id ?? '');
  };

  const project = useMemo(
    () => projects.find((p) => p.id === projectId) ?? null,
    [projects, projectId]
  );

  const [branchName, setBranchName] = useState('');
  const [branchPrefix, setBranchPrefix] = useState('');
  const [prefixTouched, setPrefixTouched] = useState(false);
  const inheritedPrefix = project?.branchPrefix ?? '';
  const prefixIsInherited = !prefixTouched && inheritedPrefix !== '';
  const prefixValue = prefixTouched ? branchPrefix : inheritedPrefix;

  const handlePrefixChange = (value: string): void => {
    setPrefixTouched(true);
    setBranchPrefix(value);
  };

  const [prompt, setPrompt] = useState('');
  const [agentId, setAgentId] = useState(() => agents[0]?.id ?? '');
  const [accountId, setAccountId] = useState(() => {
    const initial = accounts.filter((a) => a.agentId === (agents[0]?.id ?? ''));
    return (initial.find((a) => a.isDefault) ?? initial[0])?.id ?? '';
  });
  const [defaultBranch, setDefaultBranch] = useState(true);
  const [symlinks, setSymlinks] = useState<string[]>(['.env', 'node_modules']);
  const [saving, setSaving] = useState(false);
  const [baseBranch, setBaseBranch] = useState('');
  const [customBranch, setCustomBranch] = useState('');
  const [branches, setBranches] = useState<string[]>([]);
  const [isGitRepo, setIsGitRepo] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    const path = project?.path;
    const run = async (): Promise<void> => {
      if (!path) {
        if (!cancelled) {
          setBaseBranch('');
          setBranches([]);
          setIsGitRepo(null);
        }
        return;
      }
      const valid = await window.api.isGitRepo(path);
      if (cancelled) return;
      setIsGitRepo(valid);
      if (!valid) {
        setBaseBranch('');
        setBranches([]);
        return;
      }
      const [branch, list] = await Promise.all([
        window.api.detectBaseBranch(path),
        window.api.listBranches(path)
      ]);
      if (cancelled) return;
      setBaseBranch(branch);
      setBranches(list);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [project?.path]);

  const agentAccounts = useMemo(
    () => accounts.filter((a) => a.agentId === agentId),
    [accounts, agentId]
  );

  const handleAgentChange = (id: string): void => {
    setAgentId(id);
    const next = accounts.filter((a) => a.agentId === id);
    const fallback = next.find((a) => a.isDefault) ?? next[0];
    setAccountId(fallback?.id ?? '');
  };

  const workspaceOptions = useMemo(
    () =>
      activeWorkspaces.map((ws) => ({
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
    [activeWorkspaces]
  );

  const projectOptions = useMemo(
    () =>
      workspaceProjects.map((p) => ({
        value: p.id,
        label: p.name,
        icon: <Folder size={13} className="shrink-0 text-text-muted" />
      })),
    [workspaceProjects]
  );

  const agentOptions = useMemo(
    () =>
      agents.map((agent) => ({
        value: agent.id,
        label: agent.name,
        icon:
          agent.slug === 'claude-code' ? (
            <img src={claudeLogo} alt="" className="h-[18px] w-[18px]" draggable={false} />
          ) : undefined
      })),
    [agents]
  );

  const accountOptions = useMemo(
    () =>
      agentAccounts.map((acc) => ({
        value: acc.id,
        label: acc.name,
        icon: (
          <span
            className={`size-1.5 shrink-0 rounded-full ${acc.isDefault ? 'bg-selected' : 'bg-text-muted'}`}
          />
        ),
        badge: acc.isDefault ? 'active and default' : undefined
      })),
    [agentAccounts]
  );

  const toggleSymlink = (name: string): void => {
    setSymlinks((prev) => (prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]));
  };

  const gitDisabled = isGitRepo === false;
  const nameError = useMemo(
    () => validateName(branchName, !gitDisabled),
    [branchName, gitDisabled]
  );
  const canCreate = projectId.length > 0 && branchName.trim().length > 0 && !saving && !nameError;

  const handleCreate = async (): Promise<void> => {
    if (!canCreate) return;
    setSaving(true);
    try {
      await window.api.startWork({
        projectId,
        name: branchName.trim(),
        agentId: agentId || undefined,
        accountId: accountId || undefined,
        baseBranch: !gitDisabled && !defaultBranch ? customBranch.trim() || undefined : undefined
      });
    } catch (err) {
      setSaving(false);
      onClose();
      toast.error('Failed to create task', {
        description: err instanceof Error ? err.message : undefined
      });
      return;
    }
    await loadSessions();
    setSaving(false);
    onClose();
    toast.success('Task created');
  };

  return (
    <>
      <ModalHeader title="New Task" subtitle="Create a new development task" />

      <ModalBody>
        <ModalDivider />

        <div className="flex flex-col gap-3">
          <Dropdown
            value={workspaceId}
            onChange={handleWorkspaceChange}
            options={workspaceOptions}
            label="// workspace"
          />

          <Dropdown
            value={projectId}
            onChange={setProjectId}
            options={projectOptions}
            label="// project"
            placeholder="select a project..."
          />

          {gitDisabled && (
            <Callout variant="warning">
              This project folder is not a git repository. The task will be created without a
              worktree, branch prefix, or symlinks.
            </Callout>
          )}

          <div className="flex flex-col gap-1">
            <Input
              value={branchName}
              onChange={setBranchName}
              placeholder={gitDisabled ? 'task-name' : 'feat-new-feature'}
              label={gitDisabled ? '// task name' : '// branch name'}
              icon={GitBranch}
            />
            {nameError && <span className="text-[10px] text-destructive-text">{nameError}</span>}
          </div>

          {!gitDisabled && (
            <Input
              value={prefixValue}
              onChange={handlePrefixChange}
              placeholder="feature/"
              label="// branch prefix (optional)"
              icon={GitBranch}
              trailing={prefixIsInherited ? <Chip>inherited</Chip> : undefined}
            />
          )}
        </div>

        <ModalDivider />

        <div className="flex flex-col gap-3">
          <Textarea
            value={prompt}
            onChange={setPrompt}
            placeholder="Implement the new authentication middleware with JWT tokens and role-based access control..."
            label="// initial prompt (optional)"
            rows={3}
          />

          <AgentCardSelector
            value={agentId}
            onChange={handleAgentChange}
            options={agentOptions}
            label="// agent"
          />

          <Dropdown
            value={accountId}
            onChange={setAccountId}
            options={accountOptions}
            label="// agent account"
            placeholder="select an account..."
          />
        </div>

        {!gitDisabled && (
          <>
            <ModalDivider />
            <div className="flex flex-col gap-2.5">
              <span className="text-[10px] font-medium text-text-muted">{'// options'}</span>

              <Checkbox
                checked={defaultBranch}
                onChange={setDefaultBranch}
                label="Start worktree from default branch"
                trailing={
                  defaultBranch && baseBranch ? (
                    <Chip>
                      <GitBranch size={9} />
                      {baseBranch}
                    </Chip>
                  ) : undefined
                }
              />

              {!defaultBranch && (
                <BranchPicker
                  value={customBranch}
                  onChange={setCustomBranch}
                  branches={branches}
                  defaultBranch={baseBranch}
                  label="// base branch"
                />
              )}

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-medium text-text-muted">
                  {'// symlink into worktree'}
                </span>
                {SYMLINK_OPTIONS.map((name) => (
                  <Checkbox
                    key={name}
                    checked={symlinks.includes(name)}
                    onChange={() => toggleSymlink(name)}
                    label={name}
                    monospace
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </ModalBody>

      <ModalDivider />

      <ModalFooter>
        <ModalButton variant="ghost" onClick={onClose}>
          cancel
        </ModalButton>
        <ModalButton onClick={handleCreate} disabled={!canCreate}>
          create task
        </ModalButton>
      </ModalFooter>
    </>
  );
}

interface CreateTaskModalProps {
  open: boolean;
  workspaceId: string;
  projectId: string;
  onClose: () => void;
}

function CreateTaskModal({
  open,
  workspaceId,
  projectId,
  onClose
}: CreateTaskModalProps): React.JSX.Element {
  const [resetCount, setResetCount] = useState(0);
  return (
    <Modal
      width={440}
      open={open}
      onClose={onClose}
      onAfterClose={() => setResetCount((c) => c + 1)}
    >
      <TaskForm
        key={`${workspaceId}-${projectId}-${resetCount}`}
        initialWorkspaceId={workspaceId}
        initialProjectId={projectId}
        onClose={onClose}
      />
    </Modal>
  );
}

export default CreateTaskModal;
