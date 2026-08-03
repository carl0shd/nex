import { useRef } from 'react';
import { Copy, Ellipsis, RotateCcw, SquareArrowOutUpRight } from 'lucide-react';
import type { ChangedFile } from '@/lib/session-view';
import ActionMenu, { type ActionMenuAction } from '@/components/ui/action-menu';
import IconButton from '@/components/ui/icon-button';
import DiffStat from '@/components/diff/diff-stat';
import DiffStatusLetter from '@/components/diff/diff-status-letter';
import { cn } from '@/lib/utils';

interface DiffFileRowProps {
  file: ChangedFile;
  label: string;
  active: boolean;
  onSelect: (name: string) => void;
  onCopyPath: (file: ChangedFile) => void;
  onOpenInIDE: (file: ChangedFile) => void;
  onDiscard: (file: ChangedFile) => void;
}

function DiffFileRow({
  file,
  label,
  active,
  onSelect,
  onCopyPath,
  onOpenInIDE,
  onDiscard
}: DiffFileRowProps): React.JSX.Element {
  const rowRef = useRef<HTMLDivElement>(null);

  const actions: ActionMenuAction[] = [
    { label: 'Copy path', icon: Copy, onClick: () => onCopyPath(file) },
    { label: 'Open in IDE', icon: SquareArrowOutUpRight, onClick: () => onOpenInIDE(file) },
    { label: 'Discard changes', icon: RotateCcw, onClick: () => onDiscard(file), destructive: true }
  ];

  return (
    <div
      ref={rowRef}
      onClick={() => onSelect(file.name)}
      className={cn(
        'group flex w-full cursor-pointer items-center justify-between gap-2 rounded px-2 py-1 text-left select-none',
        active ? 'bg-bg-mute/50' : 'hover:bg-bg-mute/50'
      )}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <DiffStatusLetter status={file.status} />
        <span
          title={file.name}
          className={cn('truncate text-[12px]', active ? 'text-text' : 'text-text-muted')}
        >
          {label}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <DiffStat added={file.added} removed={file.removed} />
        {/* Fades rather than unmounts: the menu anchors to this element, and a
            display:none trigger would strand the open menu at the viewport origin. */}
        <div className="opacity-0 group-hover:opacity-100">
          <ActionMenu
            rowRef={rowRef}
            trigger={<IconButton icon={Ellipsis} size={12} />}
            actions={actions}
          />
        </div>
      </div>
    </div>
  );
}

export default DiffFileRow;
