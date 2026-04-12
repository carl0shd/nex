import { Search } from 'lucide-react';
import Kbd from '@/components/ui/kbd';

interface CommandBarProps {
  onClick?: () => void;
}

function CommandBar({ onClick }: CommandBarProps): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      className="group flex max-h-7 w-80 cursor-pointer items-center justify-between rounded-md border border-border-soft bg-bg-soft/50 py-1.5 pr-1.5 pl-3 hover:border-border hover:bg-bg-mute/50"
    >
      <div className="flex items-center gap-2">
        <Search size={13} className="text-text-muted" />
        <span className="text-[12px] text-text-placeholder group-hover:text-text-muted">
          Search or type a command...
        </span>
      </div>
      <Kbd className="group-hover:border-border">⌘K</Kbd>
    </button>
  );
}

export default CommandBar;
