import { useEffect, useRef, useState } from 'react';
import { Folder, FolderOpen, GitBranch, Link2 } from 'lucide-react';
import {
  ModalPanel,
  ModalHeader,
  ModalDivider,
  ModalFooter,
  ModalButton
} from '@/components/ui/modal';
import { TextField } from '@/components/ui/text-field';
import FolderPicker from '@/components/ui/folder-picker';
import QuickCommandList from '@/components/ui/quick-command-list';
import WorkspaceBadge from '@/components/ui/workspace-badge';
import SegmentedControl from '@/components/ui/segmented-control';
import Callout from '@/components/ui/callout';
import { useOnboardingStore } from '@/stores/onboarding.store';
import { repoNameFromUrl } from '@/lib/git';
import { cleanIpcError } from '@/lib/ipc';
import type { GitInfo } from '@native/git/clone';

const CLONE_PHASES: Record<string, string> = {
  'Counting objects': 'counting',
  'Compressing objects': 'compressing',
  'Receiving objects': 'receiving',
  'Resolving deltas': 'resolving',
  'Updating files': 'checking out'
};

function StepProject(): React.JSX.Element {
  const { workspace, project, setProject, setStep } = useOnboardingStore();
  const { name, path, source, repoUrl, cloneDir, branchPrefix, quickCommands } = project;

  const [git, setGit] = useState<GitInfo | null>(null);
  const [cloning, setCloning] = useState(false);
  const [cloneStatus, setCloneStatus] = useState<string | null>(null);
  const [cloneError, setCloneError] = useState<string | null>(null);
  const autoNameRef = useRef<string>('');

  useEffect(() => {
    void window.api.detectGit().then(setGit);
  }, []);

  const canContinue =
    source === 'git'
      ? git?.installed === true &&
        repoUrl.trim().length > 0 &&
        cloneDir.trim().length > 0 &&
        name.trim().length > 0
      : name.trim().length > 0 && path.trim().length > 0;

  const handleBrowse = async (): Promise<void> => {
    const dir = await window.api.pickDirectory();
    if (dir) {
      setProject({ path: dir });
      if (!name) {
        const parts = dir.split('/');
        setProject({ name: parts[parts.length - 1] });
      }
    }
  };

  const handleBrowseCloneDir = async (): Promise<void> => {
    const dir = await window.api.pickDirectory();
    if (dir) setProject({ cloneDir: dir });
  };

  const handleUrlChange = (url: string): void => {
    setCloneError(null);
    const derived = repoNameFromUrl(url);
    const nameWasAuto = name === '' || name === autoNameRef.current;
    autoNameRef.current = derived;
    setProject({ repoUrl: url, ...(nameWasAuto ? { name: derived } : {}) });
  };

  const handleContinue = async (): Promise<void> => {
    if (source === 'local') {
      setStep(4);
      return;
    }

    setCloning(true);
    setCloneError(null);
    setCloneStatus('cloning...');
    const unsubscribe = window.api.onCloneProgress(({ phase, percent }) => {
      const label = CLONE_PHASES[phase] ?? 'cloning';
      setCloneStatus(percent === null ? `${label}...` : `${label} ${percent}%`);
    });
    try {
      const result = await window.api.cloneRepository(repoUrl, cloneDir);
      setProject({ path: result.path });
      setStep(4);
    } catch (err) {
      setCloneError(cleanIpcError(err));
    } finally {
      unsubscribe();
      setCloning(false);
      setCloneStatus(null);
    }
  };

  return (
    <ModalPanel width={460}>
      <ModalHeader
        label="Step 3 of 4"
        title="Add Your First Project"
        subtitle="Connect a project to your new workspace"
      />

      <ModalDivider />

      <div className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-text-muted">{'// workspace'}</label>
          <div className="flex items-center gap-2 rounded border border-border-soft bg-bg-input px-2.5 py-2">
            <WorkspaceBadge
              name={workspace.name}
              color={workspace.color}
              icon={workspace.icon}
              customImage={workspace.customImage}
              size={16}
              fontSize={9}
              rounded="rounded-sm"
            />
            <span className="text-[12px] text-text">{workspace.name}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-medium text-text-muted">{'// source'}</label>
            {git?.installed && (
              <span className="text-[10px] text-text-muted">git {git.version} detected</span>
            )}
          </div>
          <SegmentedControl
            value={source}
            onChange={(next) => {
              setCloneError(null);
              setProject({ source: next });
            }}
            options={[
              { value: 'local', label: 'local folder', icon: FolderOpen },
              { value: 'git', label: 'clone with git', icon: GitBranch }
            ]}
          />
        </div>

        {source === 'git' && git !== null && !git.installed && (
          <Callout variant="warning">
            git was not detected on your machine. Install the Xcode Command Line Tools or git from
            git-scm.com, then come back to this step.
          </Callout>
        )}

        {source === 'git' && (git === null || git.installed) && (
          <>
            <TextField
              value={repoUrl}
              onChange={handleUrlChange}
              placeholder="https://github.com/user/repo.git"
              label="// repository url"
              icon={Link2}
              disabled={cloning}
            />

            <FolderPicker
              value={cloneDir}
              onBrowse={handleBrowseCloneDir}
              label="// clone into"
              placeholder="select destination folder..."
            />
          </>
        )}

        {(source === 'local' || git === null || git.installed) && (
          <TextField
            value={name}
            onChange={(v) => setProject({ name: v })}
            placeholder="my-first-project"
            label="// project name"
            icon={Folder}
            disabled={cloning}
          />
        )}

        {source === 'local' && <FolderPicker value={path} onBrowse={handleBrowse} />}

        <TextField
          value={branchPrefix}
          onChange={(v) => setProject({ branchPrefix: v })}
          placeholder="feature/"
          label="// branch prefix (optional)"
          icon={GitBranch}
          disabled={cloning}
        />

        {cloneError && <Callout variant="error">{cloneError}</Callout>}

        <ModalDivider />

        <QuickCommandList
          commands={quickCommands}
          onChange={(cmds) => setProject({ quickCommands: cmds })}
        />
      </div>

      <ModalDivider />

      <ModalFooter>
        <ModalButton
          variant="ghost"
          className="mr-auto"
          onClick={() => setStep(4)}
          disabled={cloning}
        >
          skip for now
        </ModalButton>
        <ModalButton variant="outline" onClick={() => setStep(2)} disabled={cloning}>
          back
        </ModalButton>
        <ModalButton onClick={handleContinue} disabled={!canContinue || cloning}>
          {source === 'git' ? (cloneStatus ?? 'clone & continue') : 'continue'}
        </ModalButton>
      </ModalFooter>
    </ModalPanel>
  );
}

export default StepProject;
