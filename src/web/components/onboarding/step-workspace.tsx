import { useMemo } from 'react';
import {
  ModalPanel,
  ModalHeader,
  ModalDivider,
  ModalFooter,
  ModalButton
} from '@/components/ui/modal';
import Input from '@/components/ui/input';
import ColorPicker from '@/components/ui/color-picker';
import IconSelector from '@/components/ui/icon-selector';
import { getWorkspaceIconOptions } from '@/lib/workspace-icons';
import WorkspaceBadge from '@/components/ui/workspace-badge';
import { useOnboardingStore } from '@/stores/onboarding.store';

function StepWorkspace(): React.JSX.Element {
  const { workspace, setWorkspace, setStep } = useOnboardingStore();
  const { name, color, icon, customImage } = workspace;

  const initial = name.trim() ? name.trim()[0].toUpperCase() : 'W';
  const canContinue = name.trim().length > 0;

  const iconOptions = useMemo(() => getWorkspaceIconOptions(initial), [initial]);

  const handlePickImage = async (): Promise<void> => {
    const dataUrl = await window.api.pickImage();
    if (dataUrl) {
      setWorkspace({ customImage: dataUrl, icon: 'custom' });
    }
  };

  return (
    <ModalPanel>
      <ModalHeader
        label="Step 2 of 4"
        title="Setup Your Workspace"
        subtitle="Create your first workspace to organize projects"
      />

      <ModalDivider />

      <div className="flex items-center gap-3">
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
        <div className="flex flex-col">
          <span className="max-w-48 truncate text-[14px] font-semibold text-text">
            {name.trim() || 'my-workspace'}
          </span>
          <span className="text-[11px] text-text-muted">0 projects</span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Input
          value={name}
          onChange={(v) => setWorkspace({ name: v.replace(/[^a-zA-Z0-9\s-]/g, '') })}
          placeholder="my-workspace"
          label="// name"
        />

        <ColorPicker
          value={color}
          onChange={(c) => setWorkspace({ color: c })}
          label="// background color"
          disabled={icon === 'custom' && !!customImage}
        />

        <IconSelector
          options={iconOptions}
          value={icon}
          onChange={(id) => setWorkspace({ icon: id })}
          onPickImage={handlePickImage}
          label="// icon"
        />
      </div>

      <ModalDivider />

      <ModalFooter>
        <ModalButton variant="ghost" onClick={() => setStep(1)}>
          Back
        </ModalButton>
        <ModalButton onClick={() => setStep(3)} disabled={!canContinue}>
          Continue
        </ModalButton>
      </ModalFooter>
    </ModalPanel>
  );
}

export default StepWorkspace;
