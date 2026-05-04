import { memo, useMemo } from 'react';
import { Plus, Play } from 'lucide-react';
import type { SessionTab, QuickCommand as QuickCommandType } from '@/lib/session-view';
import TerminalTab from '@/components/session/terminal-tab';
import QuickCommand from '@/components/session/quick-command';
import OverflowBadge from '@/components/ui/overflow-badge';
import IconButton from '@/components/ui/icon-button';
import ContextMenu, { type ContextMenuAction } from '@/components/ui/context-menu';

interface TabBarProps {
  tabs: SessionTab[];
  commands: QuickCommandType[];
  maxVisibleTabs?: number;
  maxVisibleCommands?: number;
}

function TabBar({
  tabs,
  commands,
  maxVisibleTabs = 2,
  maxVisibleCommands = 2
}: TabBarProps): React.JSX.Element {
  const visibleTabs = tabs.slice(0, maxVisibleTabs);
  const hiddenTabCount = Math.max(0, tabs.length - maxVisibleTabs);
  const visibleCommands = commands.slice(0, maxVisibleCommands);
  const hiddenCommands = commands.slice(maxVisibleCommands);

  const overflowActions = useMemo<ContextMenuAction[]>(
    () =>
      hiddenCommands.map((cmd) => ({
        label: cmd.label,
        icon: Play,
        iconClassName: 'text-badge-success-text',
        onClick: () => {}
      })),
    [hiddenCommands]
  );

  return (
    <div className="flex items-center justify-between gap-0.5 border-b border-border-soft bg-bg-soft p-1">
      <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
        {visibleTabs.map((tab) => (
          <TerminalTab key={tab.name} name={tab.name} dotColor={tab.dotColor} active={tab.active} />
        ))}
        {hiddenTabCount > 0 && <OverflowBadge count={hiddenTabCount} />}
        <IconButton icon={Plus} size={12} variant="ghost" className="shrink-0" />
      </div>

      <div className="flex items-center gap-1">
        {visibleCommands.map((cmd) => (
          <QuickCommand key={cmd.label} label={cmd.label} />
        ))}
        {hiddenCommands.length > 0 && (
          <ContextMenu
            trigger={<OverflowBadge count={hiddenCommands.length} />}
            actions={overflowActions}
          />
        )}
      </div>
    </div>
  );
}

export default memo(TabBar);
