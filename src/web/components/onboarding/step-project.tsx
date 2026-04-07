import { Folder, GitBranch } from 'lucide-react';
import {
  ModalPanel,
  ModalHeader,
  ModalDivider,
  ModalFooter,
  ModalButton
} from '@/components/ui/modal';
import Input from '@/components/ui/input';
import FolderPicker from '@/components/ui/folder-picker';
import QuickCommandList from '@/components/ui/quick-command-list';
import WorkspaceBadge from '@/components/ui/workspace-badge';
import { useOnboardingStore } from '@/stores/onboarding.store';

function StepProject(): React.JSX.Element {
  const { workspace, project, setProject, setStep } = useOnboardingStore();
  const { name, path, branchPrefix, quickCommands } = project;

  const canContinue = name.trim().length > 0 && path.trim().length > 0;

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
          <div className="flex items-center gap-2 rounded border border-border bg-bg-input px-2.5 py-2">
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

        <Input
          value={name}
          onChange={(v) => setProject({ name: v })}
          placeholder="my-first-project"
          label="// project name"
          icon={Folder}
        />

        <FolderPicker value={path} onBrowse={handleBrowse} />

        <Input
          value={branchPrefix}
          onChange={(v) => setProject({ branchPrefix: v })}
          placeholder="feature/"
          label="// branch prefix (optional)"
          icon={GitBranch}
        />

        <ModalDivider />

        <QuickCommandList
          commands={quickCommands}
          onChange={(cmds) => setProject({ quickCommands: cmds })}
        />
      </div>

      <ModalDivider />

      <ModalFooter>
        <ModalButton variant="ghost" onClick={() => setStep(2)}>
          back
        </ModalButton>
        <ModalButton onClick={() => setStep(4)} disabled={!canContinue}>
          continue
        </ModalButton>
      </ModalFooter>
    </ModalPanel>
  );
}

export default StepProject;
