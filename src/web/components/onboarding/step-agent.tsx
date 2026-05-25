import { useEffect, useState } from 'react';
import { Check, Terminal } from 'lucide-react';
import {
  ModalPanel,
  ModalHeader,
  ModalDivider,
  ModalFooter,
  ModalButton
} from '@/components/ui/modal';
import OptionCard from '@/components/ui/option-card';
import { useOnboardingStore } from '@/stores/onboarding.store';
import { useAgentStore } from '@/stores/agent.store';
import claudeLogo from '@/assets/images/claude-logo.svg';
import type { AvailableAgent } from '@native/agents/detect';

interface StepAgentProps {
  onFinish: () => void;
}

const AGENT_LOGOS: Record<string, string> = {
  'claude-code': claudeLogo
};

function StepAgent({ onFinish }: StepAgentProps): React.JSX.Element {
  const setStep = useOnboardingStore((s) => s.setStep);
  const setAgentId = useOnboardingStore((s) => s.setAgentId);
  const loadAgents = useAgentStore((s) => s.loadAgents);
  const loadAccounts = useAgentStore((s) => s.loadAccounts);
  const [available, setAvailable] = useState<AvailableAgent[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    async function detect(): Promise<void> {
      try {
        const list = await window.api.detectAgents();
        const installed = list.filter((a) => a.installed);
        setAvailable(installed);
        setSelectedSlug(installed[0]?.slug ?? null);
      } finally {
        setLoading(false);
      }
    }
    void detect();
  }, []);

  const handleFinish = async (): Promise<void> => {
    if (selectedSlug === null) {
      setAgentId('skip');
      onFinish();
      return;
    }
    setInstalling(true);
    try {
      const result = await window.api.installAgent(selectedSlug);
      await Promise.all([loadAgents(), loadAccounts()]);
      setAgentId(result.agent.id);
      onFinish();
    } finally {
      setInstalling(false);
    }
  };

  return (
    <ModalPanel>
      <ModalHeader
        label="Step 4 of 4"
        title="Select Your Default Agent"
        subtitle="Choose the AI agent that will be used when creating new worktrees"
      />

      <ModalDivider />

      {loading ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-border-soft border-t-text-muted" />
          <span className="text-[12px] text-text-muted">Detecting agents...</span>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {available.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-medium text-text-muted">
                {available.length > 1 ? '// detected agents' : '// detected agent'}
              </span>
              {available.map((a) => {
                const logo = AGENT_LOGOS[a.slug];
                return (
                  <OptionCard
                    key={a.slug}
                    selected={selectedSlug === a.slug}
                    onClick={() => setSelectedSlug(a.slug)}
                    icon={
                      logo ? (
                        <img src={logo} alt="" className="h-5 w-5" draggable={false} />
                      ) : (
                        <Terminal size={18} className="text-text-secondary" />
                      )
                    }
                    title={a.name}
                    subtitle={a.suggestedAccount ? a.suggestedAccount.name : 'no account detected'}
                  />
                );
              })}
            </div>
          )}

          {available.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-4">
              <span className="text-[13px] text-text-secondary">No agents detected</span>
            </div>
          )}

          <ModalDivider />

          <OptionCard
            selected={selectedSlug === null}
            onClick={() => setSelectedSlug(null)}
            icon={<Terminal size={18} className="text-text-secondary" />}
            title="Skip for now"
            subtitle="Run your agent manually in the worktree session or configure one later in settings"
            titleClassName="text-[13px] font-medium text-text-secondary"
          />
        </div>
      )}

      <ModalFooter>
        <ModalButton variant="ghost" onClick={() => setStep(3)}>
          back
        </ModalButton>
        <ModalButton onClick={handleFinish} disabled={loading || installing}>
          <Check size={14} />
          {installing ? 'setting up...' : 'finish setup'}
        </ModalButton>
      </ModalFooter>
    </ModalPanel>
  );
}

export default StepAgent;
