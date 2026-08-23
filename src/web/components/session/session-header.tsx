import { memo, type HTMLAttributes, type Ref } from 'react';
import { ExternalLink, X } from 'lucide-react';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import type { TerminalStatus } from '@native/db/types';
import IconButton from '@/components/ui/icon-button';
import StatusDot from '@/components/ui/status-dot';

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
      className="flex cursor-grab items-center justify-between border-b border-border-soft bg-bg-soft px-3 py-2 select-none active:cursor-grabbing"
    >
      <div className="flex items-center gap-2 overflow-hidden">
        {status && <StatusDot status={status} />}
        <span className="text-[13px] font-semibold text-text">{branch}</span>
        <span className="text-[12px] text-text-muted">{projectName}</span>
        <IconButton icon={ExternalLink} size={11} onClick={onOpenIDE} />
      </div>
      <IconButton icon={X} size={14} onClick={onClose} />
    </div>
  );
}

export default memo(SessionHeader);
