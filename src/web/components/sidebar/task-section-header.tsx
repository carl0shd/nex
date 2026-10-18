import { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import CountBadge from '@/components/sidebar/count-badge';
import IconButton from '@/components/ui/icon-button';
import { cn } from '@/lib/utils';

interface TaskSectionHeaderProps {
  count: number;
  searchOpen: boolean;
  query: string;
  onQueryChange: (query: string) => void;
  onSearchOpenChange: (open: boolean) => void;
}

const GLIDE = 'duration-180 ease-glide';

function TaskSectionHeader({
  count,
  searchOpen,
  query,
  onQueryChange,
  onSearchOpenChange
}: TaskSectionHeaderProps): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  const close = (): void => {
    onSearchOpenChange(false);
    onQueryChange('');
  };

  return (
    <div className="sidebar-copy relative mx-2 mb-0.5 h-8 w-61">
      <div
        aria-hidden={searchOpen}
        className={cn(
          'absolute inset-0 flex items-center gap-2 px-2 transition-[opacity,translate]',
          GLIDE,
          searchOpen && 'pointer-events-none -translate-x-1 opacity-0'
        )}
      >
        <span className="eyebrow">Tasks</span>
        <CountBadge count={count} />
      </div>

      <IconButton
        icon={Search}
        size={13}
        title="Search tasks"
        onClick={() => onSearchOpenChange(true)}
        className={cn(
          'absolute top-1 right-1 z-10 size-6',
          searchOpen && 'pointer-events-none opacity-0'
        )}
      />

      <div
        className={cn(
          'absolute top-0 right-0 z-20 flex h-8 items-center overflow-hidden rounded-control bg-field text-ink-3 shadow-hairline transition-[width,opacity] focus-within:text-ink-2',
          GLIDE,
          searchOpen ? 'w-full opacity-100' : 'pointer-events-none w-7 opacity-0'
        )}
      >
        <Search size={13} className="ml-2.5 shrink-0" />
        <input
          ref={inputRef}
          value={query}
          tabIndex={searchOpen ? 0 : -1}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') close();
          }}
          placeholder="Search tasks"
          aria-label="Search tasks"
          className="ml-2 min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-4"
        />
        <IconButton
          icon={X}
          size={12}
          title="Close search"
          tabIndex={searchOpen ? 0 : -1}
          onClick={close}
          className="mr-0.5 size-7 shrink-0"
        />
      </div>
    </div>
  );
}

export default TaskSectionHeader;
