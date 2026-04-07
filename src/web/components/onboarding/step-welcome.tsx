import { useEffect, useState } from 'react';
import { Terminal, GitBranch, LayoutDashboard } from 'lucide-react';
import { DialogPanel } from '@headlessui/react';
import { ModalHeader, ModalDivider, ModalFooter, ModalButton } from '@/components/ui/modal';
import nexLogo from '@/assets/images/logo-white.svg';
import { useOnboardingStore } from '@/stores/onboarding.store';
import type { LucideIcon } from 'lucide-react';

function FeatureItem({ icon: Icon, text }: { icon: LucideIcon; text: string }): React.JSX.Element {
  return (
    <div className="flex items-center gap-3">
      <Icon size={16} className="shrink-0 text-text-secondary" />
      <span className="text-[13px] text-text-secondary">{text}</span>
    </div>
  );
}

function WelcomeGlow(): React.JSX.Element | null {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setReady(true));
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!ready) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute"
        style={{
          inset: '-50%',
          background:
            'radial-gradient(ellipse at 30% 50%, rgba(23, 95, 82, 0.95), rgba(30, 64, 175, 0.65) 30%, rgba(107, 33, 168, 0.45) 55%, transparent 75%)',
          filter: 'blur(40px)',
          opacity: 0,
          transform: 'translateX(-80%) scale(0.8)',
          animation:
            'welcomeMove 3s cubic-bezier(0.16, 1, 0.3, 1) forwards, welcomeFade 2.2s ease-in-out forwards'
        }}
      />
    </div>
  );
}

function StepWelcome(): React.JSX.Element {
  const { setStep, introPlayed, setIntroPlayed } = useOnboardingStore();
  const [visible, setVisible] = useState(introPlayed);
  const [glowDone, setGlowDone] = useState(introPlayed);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (introPlayed) return;

    const t1 = setTimeout(() => setVisible(true), 400);
    const t2 = setTimeout(() => setGlowDone(true), 2700);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [introPlayed]);

  return (
    <>
      {visible && !introPlayed && (
        <div
          className="pointer-events-none fixed inset-0"
          style={{
            opacity: leaving ? 0 : 1,
            transition: 'opacity 400ms ease-out'
          }}
        >
          <WelcomeGlow />
        </div>
      )}
      <style>{`
        @keyframes welcomeMove {
          0% { transform: translateX(-80%) scale(0.8); }
          100% { transform: translateX(25%); }
        }
        @keyframes welcomeFade {
          0% { opacity: 0; }
          25% { opacity: 0.5; }
          75% { opacity: 0.1; }
          100% { opacity: 0; }
        }
      `}</style>
      <DialogPanel
        className="relative flex w-110 flex-col gap-5 rounded-lg border border-border-strong bg-bg-panel p-6 shadow-2xl"
        style={
          introPlayed
            ? undefined
            : {
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(50px)',
                transition:
                  'opacity 700ms ease-out 400ms, transform 1100ms cubic-bezier(0.22, 1, 0.36, 1) 400ms'
              }
        }
      >
        <ModalHeader
          label="Step 1 of 4"
          subtitle="Let's set up your workspace and first project to get started"
        />

        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-text">Welcome to</span>
          <img src={nexLogo} alt="Nex" className="h-6" draggable={false} />
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
              if (glowDone) {
                setIntroPlayed();
                setStep(2);
              } else {
                setLeaving(true);
                setTimeout(() => {
                  setIntroPlayed();
                  setStep(2);
                }, 400);
              }
            }}
          >
            Get Started
          </ModalButton>
        </ModalFooter>
      </DialogPanel>
    </>
  );
}

export default StepWelcome;
