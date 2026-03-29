import { Search } from 'lucide-react';

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
      <kbd className="select-none rounded border border-border-soft bg-bg-mute/50 px-1.5 py-0.5 font-[system-ui] text-[10px] leading-none text-text-muted group-hover:border-border group-hover:text-text-muted">
        ⌘K
      </kbd>
    </button>
  );
}

export default CommandBar;
