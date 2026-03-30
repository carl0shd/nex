import { ExternalLink, X } from 'lucide-react';
import type { Worktree } from '@/lib/worktree';
import IconButton from '@/components/ui/icon-button';

interface WorktreeHeaderProps {
  worktree: Pick<Worktree, 'branch' | 'workspace' | 'project' | 'dotColor' | 'active'>;
  onClose?: () => void;
  onOpenIDE?: () => void;
}

function WorktreeHeader({ worktree, onClose, onOpenIDE }: WorktreeHeaderProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between border-b border-border bg-bg-raised px-3 py-2">
      <div className="flex items-center gap-2 overflow-hidden">
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: worktree.dotColor }}
        />
        <span className="text-[13px] font-semibold text-text">{worktree.branch}</span>
        <span className="text-[12px] text-text-muted">
          {worktree.workspace} / {worktree.project}
        </span>
        <IconButton icon={ExternalLink} size={11} onClick={onOpenIDE} />
      </div>
      <IconButton icon={X} size={14} onClick={onClose} />
    </div>
  );
}

export default WorktreeHeader;
