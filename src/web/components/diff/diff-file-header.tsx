import { ArrowRight, ChevronDown } from 'lucide-react';
import type { FileDiffMetadata } from '@pierre/diffs/react';
import DiffStatusBadge from './diff-status-badge';
import DiffStat from './diff-stat';
import { cn } from '@/lib/utils';

interface DiffFileHeaderProps {
  fileDiff: FileDiffMetadata;
  collapsed?: boolean;
  onToggle?: (name: string) => void;
}

function counts(fileDiff: FileDiffMetadata): { added: number; removed: number } {
  let added = 0;
  let removed = 0;
  for (const hunk of fileDiff.hunks) {
    added += hunk.additionLines;
    removed += hunk.deletionLines;
  }
  return { added, removed };
}

function DiffFileHeader({ fileDiff, collapsed, onToggle }: DiffFileHeaderProps): React.JSX.Element {
  const { added, removed } = counts(fileDiff);
  const isRename = fileDiff.prevName != null && fileDiff.prevName !== fileDiff.name;

  return (
    <div
      onClick={() => onToggle?.(fileDiff.name)}
      className={cn(
        'interactive group flex min-h-11 w-full min-w-0 items-center gap-2 bg-surface px-3 select-none',
        onToggle && 'cursor-pointer hover:bg-muted'
      )}
    >
      {onToggle && (
        <ChevronDown
          size={13}
          className={cn(
            'shrink-0 text-ink-4 transition-transform duration-200 ease-out-strong group-hover:text-ink-3',
            collapsed && '-rotate-90'
          )}
        />
      )}
      <DiffStatusBadge type={fileDiff.type} />
      <div className="flex min-w-0 items-center gap-1.5 text-xs">
        {isRename && (
          <>
            <span className="shrink truncate text-ink-3">{fileDiff.prevName}</span>
            <ArrowRight size={12} className="shrink-0 text-ink-3" />
          </>
        )}
        <span className="truncate font-mono text-xs font-medium text-ink">{fileDiff.name}</span>
      </div>
      <span className="flex-1" />
      <DiffStat added={added} removed={removed} size="md" order="removed-first" />
    </div>
  );
}

export default DiffFileHeader;
