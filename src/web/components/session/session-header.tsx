import { memo, type HTMLAttributes, type Ref } from 'react';
import { ExternalLink, X } from 'lucide-react';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import type { TerminalStatus } from '@native/db/types';
import IconButton from '@/components/ui/icon-button';
import { StatusPill } from '@/components/ui/status-pill';

interface SessionHeaderProps {
  branch: string;
  projectName: string;
  status: TerminalStatus | null;
  onClose?: () => void;
  onOpenIDE?: () => void;
  dragRef?: Ref<HTMLDivElement>;
  dragAttributes?: HTMLAttributes<HTMLDivElement>;
  dragListeners?: SyntheticListenerMap;
}

function SessionHeader({
  branch,
  projectName,
  status,
  onClose,
  onOpenIDE,
  dragRef,
  dragAttributes,
  dragListeners
}: SessionHeaderProps): React.JSX.Element {
  return (
    <div
      ref={dragRef}
      {...dragAttributes}
      {...dragListeners}
      className="flex h-10 shrink-0 cursor-grab items-center justify-between gap-2 border-b border-line-soft pr-1.5 pl-3.5 select-none active:cursor-grabbing"
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="truncate text-sm font-medium text-ink">{branch}</span>
        <span className="truncate text-xs text-ink-3">{projectName}</span>
        {status === 'running' && (
          <StatusPill tone="green" pulse>
            Working
          </StatusPill>
        )}
        {status === 'waiting' && (
          <StatusPill tone="orange" pulse>
            Needs input
          </StatusPill>
        )}
      </div>
      <div className="flex shrink-0 items-center">
        <IconButton icon={ExternalLink} size={13} onClick={onOpenIDE} title="Open in IDE" />
        <IconButton icon={X} size={14} onClick={onClose} title="Close task" />
      </div>
    </div>
  );
}

export default memo(SessionHeader);
