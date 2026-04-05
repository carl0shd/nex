import { Rocket, Code, Palette, Zap, ImagePlus } from 'lucide-react';
import { Modal, ModalHeader, ModalDivider, ModalFooter, ModalButton } from '@/components/ui/modal';
import Input from '@/components/ui/input';
import ColorPicker from '@/components/ui/color-picker';
import IconSelector from '@/components/ui/icon-selector';
import { useOnboardingStore } from '@/stores/onboarding.store';
import type { IconSelectorOption } from '@/components/ui/icon-selector';

function StepWorkspace(): React.JSX.Element {
  const { workspace, setWorkspace, setStep } = useOnboardingStore();
  const { name, color, icon, customImage } = workspace;

  const initial = name.trim() ? name.trim()[0].toUpperCase() : 'W';
  const canContinue = name.trim().length > 0;
  const isCustomImage = icon === 'custom' && !!customImage;

  const iconOptions: IconSelectorOption[] = [
    { id: 'letter', type: 'letter', letter: initial },
    { id: 'rocket', type: 'icon', icon: Rocket },
    { id: 'code', type: 'icon', icon: Code },
    { id: 'palette', type: 'icon', icon: Palette },
    { id: 'zap', type: 'icon', icon: Zap },
    { id: 'custom', type: 'image-picker', icon: ImagePlus }
  ];

  const activeIconOption = iconOptions.find((i) => i.id === icon);

  const handlePickImage = async (): Promise<void> => {
    const dataUrl = await window.api.pickImage();
    if (dataUrl) {
      setWorkspace({ customImage: dataUrl, icon: 'custom' });
    }
  };

  return (
    <Modal>
      <ModalHeader
        label="Step 2 of 4"
        title="Setup Your Workspace"
        subtitle="Create your first workspace to organize projects"
      />

      <ModalDivider />

      <div className="flex items-center gap-3">
        <div
          className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg text-text"
          style={isCustomImage ? undefined : { backgroundColor: color }}
        >
          {isCustomImage ? (
            <img
              src={customImage!}
              alt=""
              className="h-full w-full object-cover"
              draggable={false}
            />
          ) : activeIconOption?.type === 'letter' ? (
            <span className="text-[22px] font-medium">{initial}</span>
          ) : (
            activeIconOption?.icon && <activeIconOption.icon size={22} className="text-text" />
          )}
        </div>
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
          disabled={isCustomImage}
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
    </Modal>
  );
}

export default StepWorkspace;
