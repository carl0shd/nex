import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, FileCode2, X } from 'lucide-react';
import { File } from '@pierre/diffs/react';
import type { DiffSnippet } from '@/stores/diff-chat.store';
import { resolveDiffTheme } from '@/components/diff/diff-theme';
import IconButton from '@/components/ui/icon-button';
import { cn } from '@/lib/utils';

interface DiffSnippetCardProps {
  snippet: DiffSnippet;
  onRemove: (id: string) => void;
}

function DiffSnippetCard({ snippet, onRemove }: DiffSnippetCardProps): React.JSX.Element {
  const [collapsed, setCollapsed] = useState(false);
  const { theme, themeType } = useMemo(() => resolveDiffTheme(), []);
  const name = snippet.file.slice(snippet.file.lastIndexOf('/') + 1);
  const Chevron = collapsed ? ChevronRight : ChevronDown;

  // The full path drives Pierre's language detection, so the snippet is
  // highlighted the same way the diff above it is.
  const file = useMemo(
    () => ({ name: snippet.file, contents: snippet.code, cacheKey: snippet.id }),
    [snippet.file, snippet.code, snippet.id]
  );

  const options = useMemo(
    () => ({
      theme,
      themeType,
      disableLineNumbers: true,
      disableFileHeader: true,
      preferredHighlighter: 'shiki-js' as const,
      overflow: 'scroll' as const
    }),
    [theme, themeType]
  );

  return (
    <div className="overflow-hidden rounded-lg border border-border-soft bg-bg-chat-input">
      <div
        onClick={() => setCollapsed((value) => !value)}
        className={cn(
          'flex cursor-pointer items-center gap-2 px-3 py-2 select-none hover:bg-bg-hover',
          !collapsed && 'border-b border-border-soft'
        )}
      >
        <Chevron size={13} className="shrink-0 text-text-muted" />
        <FileCode2 size={13} className="shrink-0 text-text-muted" />
        <span title={snippet.file} className="truncate text-[12px] font-medium text-text">
          {name}
        </span>
        <span className="shrink-0 font-mono text-[11px] text-text-muted">
          ({snippet.start}-{snippet.end}
          {snippet.side === 'deletions' ? ', old' : ''})
        </span>
        <span className="flex-1" />
        <IconButton
          icon={X}
          size={13}
          onClick={(event) => {
            event.stopPropagation();
            onRemove(snippet.id);
          }}
        />
      </div>

      {!collapsed && (
        <div className="diff-snippet max-h-56 overflow-auto py-1">
          <File file={file} options={options} disableWorkerPool />
        </div>
      )}
    </div>
  );
}

export default DiffSnippetCard;
