import { MoreHorizontal, Square, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { statusToVariant } from '@/lib/status';
import type { Status } from '@/lib/status';
import IconButton from '@/components/ui/icon-button';

interface TerminalBoxProps {
  title: string;
  branch?: string;
  status?: Status;
  active?: boolean;
  children?: React.ReactNode;
}

function TerminalBox({
  title,
  branch,
  status = 'idle',
  active = true,
  children
}: TerminalBoxProps): React.JSX.Element {
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-lg border border-line-soft shadow-sm ${
        active ? 'opacity-100' : 'opacity-50'
      }`}
    >
      <div className="flex items-center justify-between border-b border-line-soft bg-canvas px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-ink">{title}</span>
          {branch && <span className="text-2xs text-ink-3">({branch})</span>}
          <Badge variant={statusToVariant[status]}>{status}</Badge>
        </div>
        <div className="flex items-center gap-0.5">
          <IconButton icon={RotateCcw} size={13} />
          <IconButton icon={Square} size={13} />
          <IconButton icon={MoreHorizontal} size={13} />
        </div>
      </div>
      <div className="flex-1 bg-surface p-3 font-mono text-sm text-ink-2">
        {children ?? (
          <div className="flex h-full min-h-50 items-center justify-center text-ink-3">
            Terminal
          </div>
        )}
      </div>
    </div>
  );
}

export default TerminalBox;
