import type { TerminalStatus } from '@native/db/types';
import StatusDot from '@/components/ui/status-dot';
import { formatElapsed, formatTimestamp } from '@/lib/time-format';
import { formatUsd } from '@/lib/usage-format';

interface SessionSummaryRowProps {
  name: string;
  projectName: string;
  branch: string;
  status: TerminalStatus;
  costUsd: number;
  createdAt: string;
  onClick: () => void;
}

function SessionSummaryRow({
  name,
  projectName,
  branch,
  status,
  costUsd,
  createdAt,
  onClick
}: SessionSummaryRowProps): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      data-glide-row
      className="relative flex w-full cursor-pointer items-center gap-2 rounded-control px-2 py-1.5 text-left outline-none select-none"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-sm text-ink">{name}</span>
          {status !== 'idle' && <StatusDot status={status} className="size-1.5" />}
        </span>
        <span className="truncate text-3xs text-ink-3">
          {projectName} · {branch}
        </span>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="font-mono text-2xs text-ink-2 tabular-nums">{formatUsd(costUsd)}</span>
        <span className="text-3xs text-ink-3" title={`Created ${formatTimestamp(createdAt)}`}>
          {formatElapsed(createdAt)}
        </span>
      </div>
    </button>
  );
}

export default SessionSummaryRow;
