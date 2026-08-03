import { ArrowLeft, Columns2, PanelLeft, Pilcrow, Rows3, WholeWord } from 'lucide-react';
import IconButton from '@/components/ui/icon-button';
import IconToggle from '@/components/ui/icon-toggle';
import SegmentedControl from '@/components/ui/segmented-control';
import DiffStat from '@/components/diff/diff-stat';
import type { DiffStyle } from '@/stores/diff-view.store';
import { cn } from '@/lib/utils';

interface DiffToolbarProps {
  branch: string;
  projectName: string;
  fileCount: number;
  totalAdded: number;
  totalRemoved: number;
  showStats: boolean;
  diffStyle: DiffStyle;
  wordDiff: boolean;
  ignoreWhitespace: boolean;
  treeVisible: boolean;
  onBack: () => void;
  onToggleTree: () => void;
  onDiffStyleChange: (style: DiffStyle) => void;
  onWordDiffChange: (value: boolean) => void;
  onIgnoreWhitespaceChange: (value: boolean) => void;
}

const DIFF_STYLE_OPTIONS = [
  { value: 'split' as const, icon: Columns2, title: 'Split view' },
  { value: 'unified' as const, icon: Rows3, title: 'Unified view' }
];

function DiffToolbar({
  branch,
  projectName,
  fileCount,
  totalAdded,
  totalRemoved,
  showStats,
  diffStyle,
  wordDiff,
  ignoreWhitespace,
  treeVisible,
  onBack,
  onToggleTree,
  onDiffStyleChange,
  onWordDiffChange,
  onIgnoreWhitespaceChange
}: DiffToolbarProps): React.JSX.Element {
  return (
    <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border-soft bg-bg-soft px-3 py-2 select-none">
      <div className="flex items-center gap-2 overflow-hidden">
        <IconButton icon={ArrowLeft} size={14} onClick={onBack} title="Back to sessions" />
        <IconButton
          icon={PanelLeft}
          size={13}
          onClick={onToggleTree}
          title="Toggle file list"
          // Variant is fixed: `ghost` swaps the button's padding and would shift the row.
          className={cn(treeVisible && 'text-text')}
        />
        <span className="truncate text-[13px] font-semibold text-text">{branch}</span>
        <span className="truncate text-[12px] text-text-muted">{projectName}</span>
        <span className="shrink-0 text-[12px] text-text-muted">
          {fileCount} {fileCount === 1 ? 'file' : 'files'}
        </span>
        {showStats && <DiffStat added={totalAdded} removed={totalRemoved} size="md" />}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <IconToggle
          icon={WholeWord}
          pressed={wordDiff}
          onPressedChange={onWordDiffChange}
          title="Highlight changes within a line"
        />
        <IconToggle
          icon={Pilcrow}
          pressed={ignoreWhitespace}
          onPressedChange={onIgnoreWhitespaceChange}
          title="Ignore whitespace changes"
        />
        <SegmentedControl
          value={diffStyle}
          options={DIFF_STYLE_OPTIONS}
          onChange={onDiffStyleChange}
        />
      </div>
    </div>
  );
}

export default DiffToolbar;
