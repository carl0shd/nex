import { PanelLeft, Bell, Smartphone, LayoutGrid, Settings } from 'lucide-react';
import IconButton from '@/components/ui/icon-button';
import CommandBar from '@/components/ui/command-bar';
import ActiveBadge from '@/components/ui/active-badge';

interface TitlebarProps {
  onToggleSidebar?: () => void;
}

function Titlebar({ onToggleSidebar }: TitlebarProps): React.JSX.Element {
  return (
    <div
      className="flex h-11.75 w-full shrink-0 items-center border-b border-border-soft bg-bg select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div
        className="flex items-center gap-3 pl-20"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <IconButton icon={PanelLeft} size={15} onClick={onToggleSidebar} />
      </div>

      <div className="flex flex-1 items-center justify-center gap-3">
        <div style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <CommandBar />
        </div>
        <ActiveBadge count={2} />
      </div>

      <div
        className="flex items-center gap-3 pr-3"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <IconButton icon={Bell} size={15} />
        <IconButton icon={Smartphone} size={15} />
        <IconButton icon={LayoutGrid} size={15} />
        <IconButton icon={Settings} size={15} />
      </div>
    </div>
  );
}

export default Titlebar;
