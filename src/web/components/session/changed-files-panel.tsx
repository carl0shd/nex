import { memo } from 'react';
import { X } from 'lucide-react';
import SimpleBar from 'simplebar-react';
import type { ChangedFile } from '@/lib/session-view';
import IconButton from '@/components/ui/icon-button';

interface ChangedFilesPanelProps {
  files: ChangedFile[];
  totalFiles: number;
  totalAdded: number;
  totalRemoved: number;
  onClose?: () => void;
}

const statusLabel: Record<ChangedFile['status'], { letter: string; className: string }> = {
  modified: { letter: 'M', className: 'text-badge-warning-text' },
  added: { letter: 'A', className: 'text-badge-success-text' },
  deleted: { letter: 'D', className: 'text-destructive-text' }
};

function ChangedFilesPanel({
  files,
  totalFiles,
  totalAdded,
  totalRemoved,
  onClose
}: ChangedFilesPanelProps): React.JSX.Element {
  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-border-soft bg-bg-soft px-2.5 py-1.5">
        <span className="text-[11px] text-text-muted">{'// changed files'}</span>
        <IconButton icon={X} size={10} ghost onClick={onClose} />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden bg-bg-soft">
        {files.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <span className="font-mono text-[11px] text-text-placeholder opacity-60">
              no changes
            </span>
          </div>
        ) : (
          <SimpleBar style={{ maxHeight: '100%', width: '100%' }} autoHide={false}>
            <div className="flex flex-col py-1">
              {files.map((file) => {
                const label = statusLabel[file.status];
                return (
                  <div key={file.name} className="flex items-center gap-2 px-2.5 py-1.25">
                    <span
                      className={`w-3 shrink-0 text-center font-mono text-[9px] font-semibold ${label.className}`}
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
                      className={`shrink-0 font-mono text-[9px] font-medium ${file.removed > 0 ? 'text-badge-error-text' : 'text-text-muted'}`}
                    >
                      -{file.removed}
                    </span>
                  </div>
                );
              })}
            </div>
          </SimpleBar>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5 border-t border-border-soft bg-bg-soft px-2.5 py-1.5 font-mono text-[10px]">
        <span className="text-text-muted">{totalFiles} files,</span>
        <span className="font-semibold text-badge-success-text">+{totalAdded}</span>
        <span className="font-semibold text-badge-error-text">-{totalRemoved}</span>
      </div>
    </div>
  );
}

export default memo(ChangedFilesPanel);
