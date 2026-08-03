import { useEffect, useMemo, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import SimpleBar from 'simplebar-react';
import type SimpleBarCore from 'simplebar-core';
import { ChevronDown, GitBranch, Search } from 'lucide-react';
import Chip from '@/components/ui/chip';
import { Field, FieldLabel } from '@/components/ui/field';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface BranchPickerProps {
  value: string;
  onChange: (value: string) => void;
  branches: string[];
  defaultBranch?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

const ROW_HEIGHT = 32;
const MAX_LIST_HEIGHT = 192;

function BranchPicker({
  value,
  onChange,
  branches,
  defaultBranch,
  label,
  placeholder = 'select a branch...',
  disabled = false
}: BranchPickerProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollEl, setScrollEl] = useState<HTMLElement | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return branches;
    return branches.filter((b) => b.toLowerCase().includes(q));
  }, [branches, query]);

  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => scrollEl,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8
  });

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const select = (branch: string): void => {
    onChange(branch);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    e.stopPropagation();
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next =
        e.key === 'ArrowDown'
          ? Math.min(activeIndex + 1, filtered.length - 1)
          : Math.max(activeIndex - 1, 0);
      setActiveIndex(next);
      virtualizer.scrollToIndex(next);
      return;
    }
    if (e.key === 'Enter' && filtered[activeIndex]) {
      e.preventDefault();
      select(filtered[activeIndex]);
    }
  };

  return (
    <Field>
      {label && <FieldLabel>{label}</FieldLabel>}
      {/* Modal: the picker lives inside the create-task dialog, and a non-modal layer
          would let a click on a branch dismiss the dialog underneath it. */}
      <Popover open={open} onOpenChange={setOpen} modal>
        <PopoverTrigger
          disabled={disabled}
          className="group flex h-9 w-full cursor-pointer items-center gap-2 rounded border border-input bg-bg-input px-2.5 outline-none data-[state=open]:border-border disabled:pointer-events-none disabled:opacity-50"
        >
          <GitBranch size={13} className="shrink-0 text-text-muted" />
          <span
            className={cn(
              'flex-1 truncate text-left text-[12px]',
              value ? 'text-text' : 'text-text-placeholder'
            )}
          >
            {value || placeholder}
          </span>
          <ChevronDown
            size={12}
            className="shrink-0 text-text-muted group-data-[state=open]:rotate-180"
          />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={4}
          className="flex w-[390px] flex-col rounded-md border-border-soft bg-bg-input p-1 shadow-[var(--nex-shadow-dropdown)]"
        >
          <div className="flex items-center gap-1.5 border-b border-border-soft px-2 py-1.5">
            <Search size={12} className="shrink-0 text-text-muted" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search branches…"
              className="flex-1 bg-transparent text-[12px] text-text placeholder:text-text-placeholder outline-none"
            />
          </div>
          <SimpleBar
            ref={(instance: SimpleBarCore | null) =>
              setScrollEl(instance?.getScrollElement() ?? null)
            }
            autoHide={false}
            style={{ maxHeight: MAX_LIST_HEIGHT }}
            className="mt-1"
          >
            {filtered.length === 0 ? (
              <div className="px-2 py-1.5 text-[11px] text-text-muted">No branches found</div>
            ) : (
              <div
                style={{ height: virtualizer.getTotalSize(), position: 'relative', width: '100%' }}
              >
                {virtualizer.getVirtualItems().map((row) => {
                  const branch = filtered[row.index];
                  return (
                    <button
                      key={branch}
                      type="button"
                      onClick={() => select(branch)}
                      onMouseEnter={() => setActiveIndex(row.index)}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${row.size}px`,
                        transform: `translateY(${row.start}px)`
                      }}
                      className={cn(
                        'flex cursor-pointer items-center gap-2 rounded px-2',
                        row.index === activeIndex && 'bg-bg-item-active'
                      )}
                    >
                      <GitBranch size={12} className="shrink-0 text-text-muted" />
                      <span
                        className={cn(
                          'flex-1 truncate text-left text-[12px]',
                          branch === value ? 'text-text' : 'text-text-secondary'
                        )}
                      >
                        {branch}
                      </span>
                      {branch === defaultBranch && <Chip>default</Chip>}
                    </button>
                  );
                })}
              </div>
            )}
          </SimpleBar>
        </PopoverContent>
      </Popover>
    </Field>
  );
}

export default BranchPicker;
