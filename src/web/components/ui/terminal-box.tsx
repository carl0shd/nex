import { MoreHorizontal, Square, RotateCcw } from 'lucide-react';
import Badge from '@/components/ui/badge';
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
      className={`flex flex-col overflow-hidden rounded-lg border border-border shadow-sm ${
        active ? 'opacity-100' : 'opacity-50'
      }`}
    >
      <div className="flex items-center justify-between border-b border-border bg-bg-soft px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-text">{title}</span>
          {branch && <span className="text-[11px] text-text-muted">({branch})</span>}
          <Badge label={status} variant={statusToVariant[status]} />
        </div>
        <div className="flex items-center gap-0.5">
          <IconButton icon={RotateCcw} size={13} />
          <IconButton icon={Square} size={13} />
          <IconButton icon={MoreHorizontal} size={13} />
        </div>
      </div>
      <div className="flex-1 bg-bg-card p-3 font-mono text-[13px] text-text-secondary">
        {children ?? (
          <div className="flex h-full min-h-50 items-center justify-center text-text-muted">
            Terminal
          </div>
        )}
      </div>
    </div>
  );
}

export default TerminalBox;
