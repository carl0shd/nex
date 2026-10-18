import { TerminalSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      <div className="flex size-11 animate-rise items-center justify-center rounded-panel bg-muted shadow-hairline">
        <TerminalSquare size={18} className="text-ink-3" />
      </div>
      <div className="flex animate-rise flex-col items-center gap-1 [animation-delay:60ms]">
        <span className="text-sm font-medium text-ink">No terminals open</span>
        <span className="text-xs text-ink-3">Create a new terminal to get started</span>
      </div>
      <div className="flex animate-rise items-center gap-2 [animation-delay:120ms]">
        {agentName && (
          <Button variant="default" onClick={onCreateAgent}>
            <AgentIcon slug={agentSlug} size={14} />
            {agentName}
          </Button>
        )}
        <Button variant="outline" onClick={onCreateShell}>
          <TerminalSquare size={13} />
          Shell
        </Button>
      </div>
    </div>
  );
}

export default NoTerminalsEmpty;
