import { TerminalSquare } from 'lucide-react';
import Button from '@/components/ui/button';
import AgentIcon from '@/components/ui/agent-icon';

interface NoTerminalsEmptyProps {
  agentName?: string;
  agentSlug?: string;
  onCreateAgent: () => void;
  onCreateShell: () => void;
}

function NoTerminalsEmpty({
  agentName,
  agentSlug,
  onCreateAgent,
  onCreateShell
}: NoTerminalsEmptyProps): React.JSX.Element {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center select-none">
      <div className="flex flex-col items-center gap-1">
        <span className="text-[13px] font-semibold text-text">No terminals open</span>
        <span className="text-[12px] text-text-muted">Create a new terminal to get started</span>
      </div>
      <div className="flex items-center gap-2">
        {agentName && (
          <Button variant="primary" onClick={onCreateAgent}>
            <AgentIcon slug={agentSlug} size={14} />
            {agentName}
          </Button>
        )}
        <Button variant="ghost" onClick={onCreateShell}>
          <TerminalSquare size={13} />
          Shell
        </Button>
      </div>
    </div>
  );
}

export default NoTerminalsEmpty;
