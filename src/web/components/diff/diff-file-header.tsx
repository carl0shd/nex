import { ArrowRight, ChevronDown, ChevronRight } from 'lucide-react';
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
  const Chevron = collapsed ? ChevronRight : ChevronDown;

  return (
    <div
      onClick={() => onToggle?.(fileDiff.name)}
      className={cn(
        'flex min-h-[44px] w-full min-w-0 items-center gap-2 bg-bg-soft px-3 select-none',
        onToggle && 'cursor-pointer hover:bg-bg-hover'
      )}
    >
      {onToggle && <Chevron size={13} className="shrink-0 text-text-muted" />}
      <DiffStatusBadge type={fileDiff.type} />
      <div className="flex min-w-0 items-center gap-1.5 text-[12px]">
        {isRename && (
          <>
            <span className="shrink truncate text-text-muted">{fileDiff.prevName}</span>
            <ArrowRight size={12} className="shrink-0 text-text-muted" />
          </>
        )}
        <span className="truncate font-semibold text-text">{fileDiff.name}</span>
      </div>
      <span className="flex-1" />
      <DiffStat added={added} removed={removed} size="md" order="removed-first" />
    </div>
  );
}

export default DiffFileHeader;
