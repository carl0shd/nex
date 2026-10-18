import { Bell, Smartphone, LayoutGrid, Settings, Palette } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFullscreen } from '@/hooks/use-fullscreen';
import { cn } from '@/lib/utils';
import IconButton from '@/components/ui/icon-button';
import CommandBar from '@/components/ui/command-bar';
import GlassIsland from '@/components/ui/glass-island';
import ActiveBadge from '@/components/layout/active-badge';
import TokensBadge from '@/components/layout/tokens-badge';
import CostBadge from '@/components/layout/cost-badge';
import SessionsPopover from '@/components/session/sessions-popover';
import CostPopover from '@/components/usage/cost-popover';
import LimitsPopover from '@/components/usage/limits-popover';
import { useUsage } from '@/hooks/use-usage';
import { limitTone } from '@/lib/usage-tone';
import { useSidebarStore } from '@/stores/sidebar.store';
import { useTerminalStore } from '@/stores/terminal.store';
import { useUsageStore } from '@/stores/usage.store';

const ACTIVE_NAV = 'bg-surface text-ink shadow-glass hover:bg-surface';

function Titlebar(): React.JSX.Element {
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
  const pathname = useLocation().pathname;
  const onSettings = pathname === '/settings';
  const onDesignSystem = pathname === '/design-system';

  useUsage();
  const summary = useUsageStore((s) => s.summary);

  // Lines the command bar up with the content edge; collapsed, it only has to clear the traffic lights.
  const leadingWidth = !sidebarCollapsed ? 264 : isFullscreen ? 56 : 80;
  const noDrag = { WebkitAppRegion: 'no-drag' } as React.CSSProperties;

  return (
    <div
      className="relative flex h-11.75 w-full shrink-0 items-center gap-2 select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div
        aria-hidden
        className="shrink-0 transition-[width] duration-280 ease-glide"
        style={{ width: leadingWidth }}
      />

      <div className="flex items-center gap-2" style={noDrag}>
        <CommandBar />
        <GlassIsland>
          <SessionsPopover>
            <ActiveBadge count={activeSessions} />
          </SessionsPopover>
          <LimitsPopover summary={summary}>
            <TokensBadge
              percent={summary?.worstPercent ?? null}
              tone={limitTone(summary?.worstPercent ?? null)}
            />
          </LimitsPopover>
          <CostPopover summary={summary}>
            <CostBadge amount={summary?.today.total.costUsd ?? 0} />
          </CostPopover>
        </GlassIsland>
      </div>

      <div className="flex-1" />

      <GlassIsland className="mr-2.5" style={noDrag}>
        {import.meta.env.DEV && (
          <IconButton
            icon={Palette}
            size={15}
            title="Design system"
            onClick={() => navigate(onDesignSystem ? '/' : '/design-system')}
            className={cn(onDesignSystem && ACTIVE_NAV)}
          />
        )}
        <IconButton icon={Bell} size={15} title="Notifications" />
        <IconButton icon={Smartphone} size={15} title="Mobile" />
        <IconButton icon={LayoutGrid} size={15} title="Layout" />
        <IconButton
          icon={Settings}
          size={15}
          title="Settings"
          onClick={() => navigate(onSettings ? '/' : '/settings')}
          className={cn(onSettings && ACTIVE_NAV)}
        />
      </GlassIsland>
    </div>
  );
}

export default Titlebar;
