import { PanelLeft, Bell, Smartphone, LayoutGrid, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFullscreen } from '@/hooks/use-fullscreen';
import { cn } from '@/lib/utils';
import IconButton from '@/components/ui/icon-button';
import CommandBar from '@/components/ui/command-bar';
import ActiveBadge from '@/components/layout/active-badge';
import TokensBadge from '@/components/layout/tokens-badge';
import CostBadge from '@/components/layout/cost-badge';
import { useSidebarStore } from '@/stores/sidebar.store';
import { useTerminalStore } from '@/stores/terminal.store';

interface TitlebarProps {
  onToggleSidebar?: () => void;
}

function Titlebar({ onToggleSidebar }: TitlebarProps): React.JSX.Element {
  const isFullscreen = useFullscreen();
  const activeSessions = useTerminalStore((s) => {
    const sessions = new Set<string>();
    for (const terminal of s.terminals) {
      if (terminal.status && terminal.status !== 'idle') sessions.add(terminal.sessionId);
    }
    return sessions.size;
  });
  const sidebarCollapsed = useSidebarStore((s) => s.collapsed.full);
  const navigate = useNavigate();
  const onSettings = useLocation().pathname === '/settings';

  const spacerClass = sidebarCollapsed ? 'pl-2' : isFullscreen ? 'pl-58.25' : 'pl-41.25';

  return (
    <div
      className="flex h-11.75 w-full shrink-0 items-center border-b border-border-soft bg-bg select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div
        className={`flex items-center gap-3 ${isFullscreen ? 'pl-3' : 'pl-20'}`}
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <IconButton icon={PanelLeft} size={15} onClick={onToggleSidebar} />
      </div>

      <div className={spacerClass} />

      <div
        className="flex items-center gap-3"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <CommandBar />
        <ActiveBadge count={activeSessions} />
        <TokensBadge percent={65} />
        <CostBadge amount={0.08} />
      </div>

      <div className="flex-1" />

      <div
        className="flex items-center gap-1 pr-3"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <IconButton icon={Bell} size={15} />
        <IconButton icon={Smartphone} size={15} />
        <IconButton icon={LayoutGrid} size={15} />
        <IconButton
          icon={Settings}
          size={15}
          title="Settings"
          onClick={() => navigate(onSettings ? '/' : '/settings')}
          className={cn(onSettings && 'text-text')}
        />
      </div>
    </div>
  );
}

export default Titlebar;
