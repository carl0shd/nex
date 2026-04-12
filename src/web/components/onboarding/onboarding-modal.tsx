import { useEffect, useState } from 'react';
import { Dialog, DialogBackdrop } from '@headlessui/react';
import StepWelcome from '@/components/onboarding/step-welcome';
import StepWorkspace from '@/components/onboarding/step-workspace';
import StepProject from '@/components/onboarding/step-project';
import StepAgent from '@/components/onboarding/step-agent';
import { useOnboardingStore } from '@/stores/onboarding.store';
import { useWorkspaceStore } from '@/stores/workspace.store';

interface OnboardingModalProps {
  onComplete: () => void;
}

function OnboardingModal({ onComplete }: OnboardingModalProps): React.JSX.Element {
  const { step, workspace, project, reset } = useOnboardingStore();
  const createWorkspace = useWorkspaceStore((s) => s.createWorkspace);
  const updateWorkspace = useWorkspaceStore((s) => s.updateWorkspace);
  const createProject = useWorkspaceStore((s) => s.createProject);

  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setOpen(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleFinish = async (): Promise<void> => {
    if (workspace.name.trim()) {
      const ws = await createWorkspace({
        name: workspace.name,
        color: workspace.color,
        icon: workspace.icon
      });

      if (workspace.icon === 'custom' && workspace.customImage) {
        const iconPath = await window.api.saveWorkspaceIcon(ws.id, workspace.customImage);
        if (iconPath) {
          await updateWorkspace(ws.id, { customImage: iconPath });
        }
      }

      if (project.name.trim() && project.path.trim()) {
        const validCommands = project.quickCommands.filter(
          (cmd) => cmd.name.trim() && cmd.command.trim()
        );
        await createProject({
          workspaceId: ws.id,
          name: project.name,
          path: project.path,
          branchPrefix: project.branchPrefix.trim(),
          quickCommands: validCommands
        });
      }
    }

    await window.api.setSetting('onboarding-complete', true);
    setOpen(false);
  };

  const handleTransitionEnd = (): void => {
    if (!open) {
      reset();
      onComplete();
    }
  };

  const renderStep = (): React.JSX.Element => {
    switch (step) {
      case 1:
        return <StepWelcome />;
      case 2:
        return <StepWorkspace />;
      case 3:
        return <StepProject />;
      case 4:
        return <StepAgent onFinish={handleFinish} />;
      default:
        return <StepWelcome />;
    }
  };

  return (
    <Dialog open={open} onClose={() => {}} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/80 duration-600 ease-in-out data-closed:opacity-0"
        onTransitionEnd={handleTransitionEnd}
      />
      <div className="fixed inset-0 flex items-center justify-center">{renderStep()}</div>
    </Dialog>
  );
}

export default OnboardingModal;
