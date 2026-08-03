import { memo } from 'react';
import { X } from 'lucide-react';
import SimpleBar from 'simplebar-react';
import type { ChangedFile } from '@/lib/session-view';
import IconButton from '@/components/ui/icon-button';
import DiffStat from '@/components/diff/diff-stat';
import DiffStatusLetter from '@/components/diff/diff-status-letter';
import { cn } from '@/lib/utils';

interface ChangedFilesPanelProps {
  files: ChangedFile[];
  totalFiles: number;
  totalAdded: number;
  totalRemoved: number;
  onClose?: () => void;
  onOpenDiff?: () => void;
  onSelectFile?: (name: string) => void;
}

function ChangedFilesPanel({
  files,
  totalFiles,
  totalAdded,
  totalRemoved,
  onClose,
  onOpenDiff,
  onSelectFile
}: ChangedFilesPanelProps): React.JSX.Element {
  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-1 border-b border-border-soft bg-bg-soft px-2.5 py-1.5">
        <button
          type="button"
          onClick={onOpenDiff}
          className="cursor-pointer select-none text-[11px] text-text-muted hover:text-text"
        >
          {'// changed files'}
        </button>
        <IconButton icon={X} size={10} ghost onClick={onClose} />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden bg-bg-soft">
        {files.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <span className="font-mono text-[11px] text-text-placeholder opacity-60">
              no changes yet
            </span>
          </div>
        ) : (
          <SimpleBar style={{ maxHeight: '100%', width: '100%' }} autoHide={false}>
            <div className="flex flex-col py-1">
              {files.map((file) => (
                <button
                  type="button"
                  key={file.name}
                  onClick={() => onSelectFile?.(file.name)}
                  className="flex cursor-pointer select-none items-center gap-2 px-2.5 py-1.25 text-left hover:bg-bg-hover"
                >
                  <DiffStatusLetter status={file.status} />
                  <span
                    className={cn(
                      'truncate font-mono text-[11px]',
                      file.status === 'deleted' ? 'text-text-muted' : 'text-text'
                    )}
                  >
                    {file.name}
                  </span>
                  <span className="flex-1" />
                  <DiffStat added={file.added} removed={file.removed} />
                </button>
              ))}
            </div>
          </SimpleBar>
        )}
      </div>

      <button
        type="button"
        onClick={onOpenDiff}
        className="flex shrink-0 cursor-pointer select-none items-center gap-1.5 border-t border-border-soft bg-bg-soft px-2.5 py-1.5 font-mono text-[10px] hover:bg-bg-hover"
      >
        <span className="text-text-muted">{totalFiles} files,</span>
        <DiffStat added={totalAdded} removed={totalRemoved} />
      </button>
    </div>
  );
}

export default memo(ChangedFilesPanel);
