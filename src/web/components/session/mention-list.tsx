import { forwardRef, useCallback, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import SimpleBar from 'simplebar-react';
import { Folder, FileCode } from 'lucide-react';
import type { WorktreeEntry } from '@/stores/worktree-files.store';

export type MentionItem = WorktreeEntry;

interface MentionListProps {
  items: MentionItem[];
  command: (item: { id: string; label: string; kind: 'file' | 'folder' }) => void;
}

export interface MentionListHandle {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

const MAX_VISIBLE = 14;
const ROW_HEIGHT = 28;

const MentionList = forwardRef<MentionListHandle, MentionListProps>(
  ({ items, command }, ref): React.JSX.Element => {
    const listRef = useRef<HTMLDivElement | null>(null);
    const selectedIndexRef = useRef(0);
    const hoverEnabledRef = useRef(true);

    const itemsKey =
      items.length === 0 ? '' : `${items.length}:${items[0].path}:${items[items.length - 1].path}`;

    const applySelection = useCallback((index: number): void => {
      const list = listRef.current;
      if (!list) return;
      const prev = list.querySelector<HTMLButtonElement>('[data-selected]');
      if (prev) prev.removeAttribute('data-selected');
      const row = list.querySelector<HTMLButtonElement>(`[data-index="${index}"]`);
      if (!row) return;
      row.setAttribute('data-selected', '');
      selectedIndexRef.current = index;
      row.scrollIntoView({ block: 'nearest' });
    }, []);

    useLayoutEffect(() => {
      applySelection(0);
    }, [itemsKey, applySelection]);

    const select = (index: number): void => {
      const item = items[index];
      if (!item) return;
      command({ id: item.path, label: item.path, kind: item.type });
    };

    useImperativeHandle(ref, () => ({
      onKeyDown: (event: KeyboardEvent): boolean => {
        if (event.key === 'ArrowDown') {
          hoverEnabledRef.current = false;
          applySelection(Math.min(selectedIndexRef.current + 1, items.length - 1));
          return true;
        }
        if (event.key === 'ArrowUp') {
          hoverEnabledRef.current = false;
          applySelection(Math.max(selectedIndexRef.current - 1, 0));
          return true;
        }
        if (event.key === 'Enter' || event.key === 'Tab') {
          select(selectedIndexRef.current);
          return true;
        }
        return false;
      }
    }));

    if (items.length === 0) {
      return (
        <div className="w-80 rounded-lg border border-border-menu bg-bg-menu p-3 text-[12px] text-text-muted shadow-lg">
          No matches
        </div>
      );
    }

    const maxHeight = Math.min(items.length, MAX_VISIBLE) * ROW_HEIGHT + 8;

    return (
      <div
        className="w-80 overflow-hidden rounded-lg border border-border-menu bg-bg-menu p-1 shadow-lg"
        onMouseMove={() => {
          hoverEnabledRef.current = true;
        }}
      >
        <SimpleBar autoHide={false} style={{ maxHeight }} scrollableNodeProps={{ ref: listRef }}>
          {items.map((item, index) => {
            const Icon = item.type === 'folder' ? Folder : FileCode;
            const name = item.path.split('/').pop() ?? item.path;
            const dir = item.path.includes('/')
              ? item.path.slice(0, item.path.length - name.length - 1)
              : '';
            return (
              <button
                key={item.path}
                data-index={index}
                onMouseEnter={() => {
                  if (hoverEnabledRef.current) applySelection(index);
                }}
                onClick={() => select(index)}
                className="flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1 text-left text-text-secondary select-none data-[selected]:bg-bg-hover data-[selected]:text-text"
              >
                <Icon size={13} className="shrink-0 text-text-muted" />
                <span className="truncate text-[12px]">{name}</span>
                {dir && (
                  <span className="ml-auto truncate pr-1 text-[10px] text-text-muted">{dir}</span>
                )}
              </button>
            );
          })}
        </SimpleBar>
      </div>
    );
  }
);

MentionList.displayName = 'MentionList';

export default MentionList;
