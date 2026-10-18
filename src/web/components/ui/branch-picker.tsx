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
          className="interactive group flex h-8 w-full cursor-pointer items-center gap-2 rounded-control border border-line bg-field px-2.5 outline-none select-none hover:border-line-strong data-[state=open]:border-ring/60 data-[state=open]:ring-3 data-[state=open]:ring-ring/15 disabled:pointer-events-none disabled:opacity-50"
        >
          <GitBranch size={13} className="shrink-0 text-ink-3" />
          <span
            className={cn('flex-1 truncate text-left text-sm', value ? 'text-ink' : 'text-ink-4')}
          >
            {value || placeholder}
          </span>
          <ChevronDown
            size={12}
            className="shrink-0 text-ink-3 transition-transform duration-200 ease-out-strong group-data-[state=open]:rotate-180"
          />
        </PopoverTrigger>
        <PopoverContent align="start" sideOffset={4} className="flex w-[390px] flex-col p-1">
          <div className="flex h-8 items-center gap-2 border-b border-line-soft px-2 pb-1">
            <Search size={12} className="shrink-0 text-ink-3" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search branches…"
              className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-4 outline-none"
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
              <div className="px-2 py-2 text-xs text-ink-3">No branches found</div>
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
                        'flex cursor-pointer items-center gap-2 rounded-[7px] px-2 transition-colors duration-100',
                        row.index === activeIndex && 'bg-hover-2'
                      )}
                    >
                      <GitBranch size={12} className="shrink-0 text-ink-3" />
                      <span
                        className={cn(
                          'flex-1 truncate text-left text-sm',
                          branch === value ? 'text-ink' : 'text-ink-2'
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
