import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';

interface CommandBarProps {
  onClick?: () => void;
}

function CommandBar({ onClick }: CommandBarProps): React.JSX.Element {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="group max-h-7 w-80 justify-between rounded-md py-1.5 pr-1.5 pl-3 font-normal hover:bg-bg-mute/50"
    >
      <span className="flex items-center gap-2">
        <Search size={13} className="text-text-muted" />
        <span className="text-[12px] text-text-placeholder group-hover:text-text-muted">
          Search or type a command...
        </span>
      </span>
      <Kbd className="group-hover:border-border">⌘K</Kbd>
    </Button>
  );
}

export default CommandBar;
