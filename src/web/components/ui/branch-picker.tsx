import { useMemo, useRef, useState } from 'react';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/react';
import { useVirtualizer } from '@tanstack/react-virtual';
import SimpleBar from 'simplebar-react';
import type SimpleBarCore from 'simplebar-core';
import { ChevronDown, ChevronUp, GitBranch, Search } from 'lucide-react';
import Chip from '@/components/ui/chip';

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
  const [query, setQuery] = useState('');
  const scrollRef = useRef<SimpleBarCore>(null);
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

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-[10px] font-medium text-text-muted">{label}</label>}
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        {({ open }) => (
          <>
            <ListboxButton
              className={`flex h-9 w-full cursor-pointer items-center gap-2 rounded border px-2.5 ${
                open ? 'border-border' : 'border-border-soft'
              } bg-bg-input ${disabled ? 'opacity-50' : ''}`}
            >
              <GitBranch size={13} className="shrink-0 text-text-muted" />
              <span
                className={`flex-1 truncate text-left text-[12px] ${
                  value ? 'text-text' : 'text-text-placeholder'
                }`}
              >
                {value || placeholder}
              </span>
              {open ? (
                <ChevronUp size={12} className="shrink-0 text-text-muted" />
              ) : (
                <ChevronDown size={12} className="shrink-0 text-text-muted" />
              )}
            </ListboxButton>
            <ListboxOptions
              portal
              anchor={{ to: 'bottom start', gap: 4 }}
              transition
              className="z-50 flex w-[390px] flex-col rounded-md border border-border-soft bg-bg-input p-1 shadow-[var(--nex-shadow-dropdown)] transition-opacity duration-100 ease-out data-closed:opacity-0"
            >
              <div className="flex items-center gap-1.5 border-b border-border-soft px-2 py-1.5">
                <Search size={12} className="shrink-0 text-text-muted" />
                <input
                  type="text"
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="Search branches…"
                  className="flex-1 bg-transparent text-[12px] text-text placeholder:text-text-placeholder outline-none"
                />
              </div>
              <SimpleBar
                ref={(instance: SimpleBarCore | null) => {
                  scrollRef.current = instance;
                  setScrollEl(instance?.getScrollElement() ?? null);
                }}
                autoHide={false}
                style={{ maxHeight: MAX_LIST_HEIGHT }}
                className="mt-1"
              >
                {filtered.length === 0 ? (
                  <div className="px-2 py-1.5 text-[11px] text-text-muted">No branches found</div>
                ) : (
                  <div
                    style={{
                      height: virtualizer.getTotalSize(),
                      position: 'relative',
                      width: '100%'
                    }}
                  >
                    {virtualItems.map((row) => {
                      const branch = filtered[row.index];
                      return (
                        <ListboxOption
                          key={branch}
                          value={branch}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: `${row.size}px`,
                            transform: `translateY(${row.start}px)`
                          }}
                          className="flex cursor-pointer items-center gap-2 rounded px-2 data-[focus]:bg-bg-item-active"
                        >
                          <GitBranch size={12} className="shrink-0 text-text-muted" />
                          <span
                            className={`flex-1 truncate text-[12px] ${
                              branch === value ? 'text-text' : 'text-text-secondary'
                            }`}
                          >
                            {branch}
                          </span>
                          {branch === defaultBranch && <Chip>default</Chip>}
                        </ListboxOption>
                      );
                    })}
                  </div>
                )}
              </SimpleBar>
            </ListboxOptions>
          </>
        )}
      </Listbox>
    </div>
  );
}

export default BranchPicker;
