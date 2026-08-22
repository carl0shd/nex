import { useEffect, useState } from 'react';
import { Modal, ModalHeader, ModalDivider, ModalFooter, ModalButton } from '@/components/ui/modal';
import Dropdown from '@/components/ui/dropdown';
import FolderPicker from '@/components/ui/folder-picker';
import RepoMultiSelect, { type RepoStatus } from '@/components/ui/repo-multi-select';
import Callout from '@/components/ui/callout';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { cleanIpcError } from '@/lib/ipc';
import type { GhInfo, GithubOwner, GithubRepo } from '@native/git/github';

const DEFAULT_WORKSPACE_COLOR = '#33843F';

const CLONE_PHASES: Record<string, string> = {
  'Counting objects': 'counting',
  'Compressing objects': 'compressing',
  'Receiving objects': 'receiving',
  'Resolving deltas': 'resolving',
  'Updating files': 'checking out'
};

function ImportForm({ onClose }: { onClose: () => void }): React.JSX.Element {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const createWorkspace = useWorkspaceStore((s) => s.createWorkspace);
  const createProject = useWorkspaceStore((s) => s.createProject);

  const [gh, setGh] = useState<GhInfo | null>(null);
  const [owners, setOwners] = useState<GithubOwner[] | null>(null);
  const [owner, setOwner] = useState('');
  const [repos, setRepos] = useState<GithubRepo[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cloneDir, setCloneDir] = useState('');
  const [importing, setImporting] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, RepoStatus>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async (): Promise<void> => {
      const info = await window.api.detectGh();
      if (cancelled) return;
      setGh(info);
      if (!info.installed || !info.authenticated) return;

      const savedDir = await window.api.getSetting<string>('github-clone-dir', '');
      if (!cancelled && savedDir) setCloneDir(savedDir);

      try {
        const list = await window.api.listGithubOwners();
        if (cancelled) return;
        setOwners(list);
        setOwner(list[0]?.login ?? '');
      } catch (err) {
        if (!cancelled) {
          setError(cleanIpcError(err));
          setOwners([]);
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectOwner = (next: string): void => {
    setOwner(next);
    setRepos(null);
    setSelected(new Set());
    setStatuses({});
  };

  useEffect(() => {
    if (!owner) return;
    let cancelled = false;
    window.api
      .listGithubRepos(owner)
      .then((list) => {
        if (!cancelled) setRepos(list);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(cleanIpcError(err));
          setRepos([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [owner]);

  const existingWorkspace = workspaces.find(
    (ws) => !ws.archived && ws.name.toLowerCase() === owner.toLowerCase()
  );

  const handleBrowse = async (): Promise<void> => {
    const dir = await window.api.pickDirectory();
    if (dir) setCloneDir(dir);
  };

  const handleToggle = (nameWithOwner: string): void => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(nameWithOwner)) next.delete(nameWithOwner);
      else next.add(nameWithOwner);
      return next;
    });
  };

  const setStatus = (repo: string, status: RepoStatus): void => {
    setStatuses((prev) => ({ ...prev, [repo]: status }));
  };

  const handleImport = async (): Promise<void> => {
    setImporting(true);
    setError(null);

    const unsubscribe = window.api.onCloneProgress(({ phase, percent, repo }) => {
      if (!repo) return;
      const label = CLONE_PHASES[phase] ?? 'cloning';
      setStatus(repo, {
        label: percent === null ? `${label}...` : `${label} ${percent}%`,
        tone: 'muted'
      });
    });

    try {
      const workspace =
        existingWorkspace ??
        (await createWorkspace({ name: owner, color: DEFAULT_WORKSPACE_COLOR, icon: 'letter' }));

      const targets = (repos ?? []).filter((r) => selected.has(r.nameWithOwner));
      let failures = 0;

      for (const repo of targets) {
        setStatus(repo.nameWithOwner, { label: 'cloning...', tone: 'muted' });
        try {
          const result = await window.api.cloneGithubRepo(repo.nameWithOwner, cloneDir);
          const alreadyAdded = useWorkspaceStore
            .getState()
            .projects.some((p) => p.path === result.path);
          if (!alreadyAdded) {
            await createProject({
              workspaceId: workspace.id,
              name: repo.name,
              path: result.path
            });
          }
          setStatus(repo.nameWithOwner, {
            label: alreadyAdded ? 'already added' : 'added',
            tone: 'success'
          });
          setSelected((prev) => {
            const next = new Set(prev);
            next.delete(repo.nameWithOwner);
            return next;
          });
        } catch (err) {
          failures++;
          setStatus(repo.nameWithOwner, { label: cleanIpcError(err), tone: 'error' });
        }
      }

      void window.api.setSetting('github-clone-dir', cloneDir);
      if (failures === 0) onClose();
    } catch (err) {
      setError(cleanIpcError(err));
    } finally {
      unsubscribe();
      setImporting(false);
    }
  };

  const canImport = selected.size > 0 && cloneDir.trim().length > 0 && !importing;
  const ready = gh?.installed === true && gh.authenticated;

  return (
    <>
      <ModalHeader
        title="Import from GitHub"
        subtitle="Clone repositories from your organizations into Nex"
      />

      <ModalDivider />

      {gh === null ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-border-soft border-t-text-muted" />
          <span className="text-[12px] text-text-muted">Detecting GitHub CLI...</span>
        </div>
      ) : !gh.installed ? (
        <Callout variant="warning">
          The GitHub CLI (gh) was not detected on your machine. Install it with{' '}
          <code className="font-mono">brew install gh</code>, then run{' '}
          <code className="font-mono">gh auth login</code> and reopen this dialog.
        </Callout>
      ) : !gh.authenticated ? (
        <Callout variant="warning">
          The GitHub CLI is installed but not logged in. Run{' '}
          <code className="font-mono">gh auth login</code> in a terminal, then reopen this dialog.
        </Callout>
      ) : (
        <div className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1">
            <Dropdown
              value={owner}
              onChange={selectOwner}
              options={(owners ?? []).map((o) => ({
                value: o.login,
                label: o.login,
                badge: o.type === 'org' ? 'org' : 'you'
              }))}
              label="// organization"
              placeholder={owners === null ? 'loading...' : 'select owner...'}
              disabled={owners === null || importing}
            />
            {owner && (
              <span className="text-[10px] text-text-muted">
                {existingWorkspace
                  ? `projects will be added to the "${existingWorkspace.name}" workspace`
                  : `a new "${owner}" workspace will be created`}
              </span>
            )}
          </div>

          <RepoMultiSelect
            repos={repos}
            selected={selected}
            onToggle={handleToggle}
            statuses={statuses}
            disabled={importing}
          />

          <FolderPicker
            value={cloneDir}
            onBrowse={handleBrowse}
            label="// clone into"
            placeholder="select destination folder..."
          />

          {error && <Callout variant="error">{error}</Callout>}
        </div>
      )}

      <ModalDivider />

      <ModalFooter>
        <ModalButton variant="outline" onClick={onClose} disabled={importing}>
          cancel
        </ModalButton>
        {ready && (
          <ModalButton onClick={handleImport} disabled={!canImport}>
            {importing
              ? 'cloning...'
              : selected.size === 0
                ? 'clone repos'
                : `clone ${selected.size} ${selected.size === 1 ? 'repo' : 'repos'}`}
          </ModalButton>
        )}
      </ModalFooter>
    </>
  );
}

interface ImportGithubModalProps {
  open: boolean;
  onClose: () => void;
}

function ImportGithubModal({ open, onClose }: ImportGithubModalProps): React.JSX.Element {
  const [resetCount, setResetCount] = useState(0);
  return (
    <Modal
      width={480}
      open={open}
      onClose={onClose}
      onAfterClose={() => setResetCount((c) => c + 1)}
    >
      <ImportForm key={resetCount} onClose={onClose} />
    </Modal>
  );
}

export default ImportGithubModal;
