import { useEffect, useState } from 'react';
import { Check, Terminal } from 'lucide-react';
import {
  ModalPanel,
  ModalHeader,
  ModalDivider,
  ModalFooter,
  ModalButton
} from '@/components/ui/modal';
import { useOnboardingStore } from '@/stores/onboarding.store';
import claudeLogo from '@/assets/images/claude-logo.svg';
import type { Agent, AgentAccount } from '@native/db/types';

interface DetectedAgent {
  agent: Agent;
  account: AgentAccount | null;
}

interface StepAgentProps {
  onFinish: () => void;
}

function StepAgent({ onFinish }: StepAgentProps): React.JSX.Element {
  const { agentId, setAgentId, setStep } = useOnboardingStore();
  const [detected, setDetected] = useState<DetectedAgent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function detect(): Promise<void> {
      await window.api.detectAgents();
      const [agents, accounts] = await Promise.all([
        window.api.getAgents(),
        window.api.getAgentAccounts()
      ]);

      const items: DetectedAgent[] = agents.map((a) => ({
        agent: a,
        account: accounts.find((acc) => acc.agentId === a.id && acc.isDefault) ?? null
      }));

      setDetected(items);
      if (items.length > 0) {
        setAgentId(items[0].agent.id);
      } else {
        setAgentId('skip');
      }

      setLoading(false);
    }
    detect();
  }, [setAgentId]);

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
          {detected.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-medium text-text-muted">{'// detected agent'}</span>
              {detected.map(({ agent, account }) => {
                const isSelected = agentId === agent.id;
                return (
                  <button
                    key={agent.id}
                    onClick={() => setAgentId(agent.id)}
                    className={`flex w-full cursor-pointer items-center gap-3 rounded-md p-3 ${
                      isSelected
                        ? 'border border-border-hover bg-bg-input'
                        : 'border border-border-soft bg-bg-input'
                    }`}
                  >
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-md"
                      style={{ backgroundColor: 'var(--nex-border)' }}
                    >
                      <img src={claudeLogo} alt="" className="h-5 w-5" draggable={false} />
                    </div>
                    <div className="flex flex-1 flex-col items-start gap-0.5">
                      <span className="text-[13px] font-medium text-text">{agent.name}</span>
                      <span className="text-[11px] text-text-muted">
                        {account ? account.name : 'not configured'}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent">
                        <Check size={12} className="text-text" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {detected.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-4">
              <span className="text-[13px] text-text-secondary">No agents detected</span>
            </div>
          )}

          <ModalDivider />

          <button
            onClick={() => setAgentId('skip')}
            className={`flex w-full cursor-pointer items-center gap-3 rounded-md p-3 ${
              agentId === 'skip'
                ? 'border border-border-hover bg-bg-input'
                : 'border border-border-soft bg-bg-input hover:border-border-hover'
            }`}
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-md"
              style={{ backgroundColor: 'var(--nex-border)' }}
            >
              <Terminal size={18} className="text-text-secondary" />
            </div>
            <div className="flex flex-1 flex-col items-start gap-0.5">
              <span className="text-[13px] font-medium text-text-secondary">Skip for now</span>
              <span className="text-left text-[11px] text-text-muted">
                Run your agent manually in the worktree session or configure one later in settings
              </span>
            </div>
            {agentId === 'skip' && (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent">
                <Check size={12} className="text-text" />
              </div>
            )}
          </button>
        </div>
      )}

      <ModalFooter>
        <ModalButton variant="ghost" onClick={() => setStep(3)}>
          back
        </ModalButton>
        <ModalButton onClick={onFinish} disabled={loading}>
          <Check size={14} />
          finish setup
        </ModalButton>
      </ModalFooter>
    </ModalPanel>
  );
}

export default StepAgent;
