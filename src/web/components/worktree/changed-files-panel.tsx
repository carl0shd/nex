import { X } from 'lucide-react';
import SimpleBar from 'simplebar-react';
import type { Worktree, ChangedFile } from '@/lib/worktree';
import IconButton from '@/components/ui/icon-button';

interface ChangedFilesPanelProps {
  worktree: Pick<Worktree, 'files' | 'totalFiles' | 'totalAdded' | 'totalRemoved'>;
  onClose?: () => void;
}

const statusLabel: Record<ChangedFile['status'], { letter: string; color: string }> = {
  modified: { letter: 'M', color: '#F59E0B' },
  added: { letter: 'A', color: '#14957D' },
  deleted: { letter: 'D', color: '#ef4444' }
};

function ChangedFilesPanel({ worktree, onClose }: ChangedFilesPanelProps): React.JSX.Element {
  return (
    <div className="flex h-full min-w-67.5 flex-col border-r border-border">
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-bg-mute px-2.5 py-1.5">
        <span className="text-[11px] text-text-muted">{'// changed files'}</span>
        <IconButton icon={X} size={10} ghost onClick={onClose} />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden bg-bg-mute">
        <SimpleBar style={{ maxHeight: '100%', width: '100%' }} autoHide={false}>
          <div className="flex flex-col py-1">
            {worktree.files.map((file) => {
              const label = statusLabel[file.status];
              return (
                <div key={file.name} className="flex items-center gap-2 px-2.5 py-1.25">
                  <span
                    className="w-3 shrink-0 text-center font-mono text-[9px] font-semibold"
                    style={{ color: label.color }}
                  >
                    {label.letter}
                  </span>
                  <span
                    className={`truncate font-mono text-[11px] ${file.status === 'deleted' ? 'text-text-muted' : 'text-text'}`}
                  >
                    {file.name}
                  </span>
                  <span className="flex-1" />
                  <span className="shrink-0 font-mono text-[9px] font-medium text-badge-success-text">
                    +{file.added}
                  </span>
                  <span
                    className={`shrink-0 font-mono text-[9px] font-medium ${file.removed > 0 ? 'text-red-400' : 'text-text-muted'}`}
                  >
                    -{file.removed}
                  </span>
                </div>
              );
            })}
          </div>
        </SimpleBar>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 border-t border-border bg-bg-mute px-2.5 py-1.5 font-mono text-[10px]">
        <span className="text-text-muted">{worktree.totalFiles} files,</span>
        <span className="font-semibold text-badge-success-text">+{worktree.totalAdded}</span>
        <span className="font-semibold text-red-400">-{worktree.totalRemoved}</span>
      </div>
    </div>
  );
}

export default ChangedFilesPanel;
