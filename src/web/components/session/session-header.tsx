import { ExternalLink, X } from 'lucide-react';
import type { SessionView } from '@/lib/session-view';
import IconButton from '@/components/ui/icon-button';

interface SessionHeaderProps {
  session: Pick<SessionView, 'branch' | 'workspace' | 'project' | 'dotColor' | 'active'>;
  onClose?: () => void;
  onOpenIDE?: () => void;
}

function SessionHeader({ session, onClose, onOpenIDE }: SessionHeaderProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between border-b border-border-soft bg-bg-soft px-3 py-2">
      <div className="flex items-center gap-2 overflow-hidden">
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: session.dotColor }}
        />
        <span className="text-[13px] font-semibold text-text">{session.branch}</span>
        <span className="text-[12px] text-text-muted">
          {session.workspace} / {session.project}
        </span>
        <IconButton icon={ExternalLink} size={11} onClick={onOpenIDE} />
      </div>
      <IconButton icon={X} size={14} onClick={onClose} />
    </div>
  );
}

export default SessionHeader;
