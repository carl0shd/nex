import { memo } from 'react';
import SimpleBar from 'simplebar-react';
import type { ChangedFile } from '@/lib/session-view';
import GlideHighlight from '@/components/ui/glide-highlight';
import PaneHeader from '@/components/session/pane-header';
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
      <PaneHeader title="Changed files" onTitleClick={onOpenDiff} onClose={onClose} />

      <div className="min-h-0 flex-1 overflow-hidden">
        {files.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <span className="text-xs text-ink-4">No changes yet</span>
          </div>
        ) : (
          <SimpleBar style={{ maxHeight: '100%', width: '100%' }} autoHide={false}>
            <GlideHighlight className="flex flex-col p-1">
              {files.map((file) => (
                <button
                  type="button"
                  key={file.name}
                  onClick={() => onSelectFile?.(file.name)}
                  data-glide-row
                  className="relative flex h-7 cursor-pointer items-center gap-2 rounded-[7px] px-2 text-left outline-none select-none"
                >
                  <DiffStatusLetter status={file.status} />
                  <span
                    className={cn(
                      'truncate font-mono text-2xs',
                      file.status === 'deleted' ? 'text-ink-3' : 'text-ink'
                    )}
                  >
                    {file.name}
                  </span>
                  <span className="flex-1" />
                  <DiffStat added={file.added} removed={file.removed} />
                </button>
              ))}
            </GlideHighlight>
          </SimpleBar>
        )}
      </div>

      <button
        type="button"
        onClick={onOpenDiff}
        className="interactive flex h-8 shrink-0 cursor-pointer items-center gap-1.5 border-t border-line-soft px-3 font-mono text-3xs select-none hover:bg-hover"
      >
        <span className="text-ink-3">{totalFiles} files</span>
        <DiffStat added={totalAdded} removed={totalRemoved} />
      </button>
    </div>
  );
}

export default memo(ChangedFilesPanel);
