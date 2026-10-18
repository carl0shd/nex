import { useEffect, useState } from 'react';
import { Terminal, GitBranch, LayoutDashboard } from 'lucide-react';
import {
  ModalPanel,
  ModalHeader,
  ModalDivider,
  ModalFooter,
  ModalButton
} from '@/components/ui/modal';
import nexLogo from '@/assets/images/logo.svg';
import { useOnboardingStore } from '@/stores/onboarding.store';
import type { LucideIcon } from 'lucide-react';

function FeatureItem({ icon: Icon, text }: { icon: LucideIcon; text: string }): React.JSX.Element {
  return (
    <div className="flex items-center gap-3">
      <Icon size={16} className="shrink-0 text-ink-2" />
      <span className="text-sm text-ink-2">{text}</span>
    </div>
  );
}

function StepWelcome(): React.JSX.Element {
  const { setStep, introPlayed, setIntroPlayed } = useOnboardingStore();
  const [visible, setVisible] = useState(introPlayed);

  useEffect(() => {
    if (introPlayed) return;

    const timer = setTimeout(() => setVisible(true), 400);
    return () => clearTimeout(timer);
  }, [introPlayed]);

  return (
    <ModalPanel
      width={440}
      style={
        introPlayed
          ? undefined
          : {
              opacity: visible ? 1 : 0,
              // Overrides the `translate` property the panel's `-translate-*` centering classes
              // set — an inline `transform` would stack on top of it and shift the panel off-center.
              translate: visible ? '-50% -50%' : '-50% calc(-50% + 50px)',
              transition:
                'opacity 700ms ease-out 400ms, translate 1100ms cubic-bezier(0.22, 1, 0.36, 1) 400ms'
            }
      }
    >
      <ModalHeader
        label="Step 1 of 4"
        subtitle="Let's set up your workspace and first project to get started"
      />

      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold text-ink">Welcome to</span>
        <img src={nexLogo} alt="Nex" className="h-6" draggable={false} />
        <span className="text-lg font-semibold text-ink">Nex</span>
      </div>

      <div className="flex flex-col gap-2">
        <FeatureItem icon={Terminal} text="Integrated terminals with smart session management" />
        <FeatureItem
          icon={GitBranch}
          text="Git worktree support by default for parallel development"
        />
        <FeatureItem icon={LayoutDashboard} text="Visual dashboard to track all your projects" />
      </div>

      <ModalDivider />

      <ModalFooter>
        <ModalButton
          onClick={() => {
            setIntroPlayed();
            setStep(2);
          }}
        >
          Get Started
        </ModalButton>
      </ModalFooter>
    </ModalPanel>
  );
}

export default StepWelcome;
