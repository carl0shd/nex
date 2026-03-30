import { Plus } from 'lucide-react';
import type { WorktreeTab, QuickCommand as QuickCommandType } from '@/lib/worktree';
import TerminalTab from '@/components/worktree/terminal-tab';
import QuickCommand from '@/components/worktree/quick-command';
import OverflowBadge from '@/components/ui/overflow-badge';
import IconButton from '@/components/ui/icon-button';

interface TabBarProps {
  tabs: WorktreeTab[];
  commands: QuickCommandType[];
  maxVisibleTabs?: number;
  commandOverflowCount?: number;
}

function TabBar({
  tabs,
  commands,
  maxVisibleTabs = 2,
  commandOverflowCount
}: TabBarProps): React.JSX.Element {
  const visibleTabs = tabs.slice(0, maxVisibleTabs);
  const hiddenTabCount = tabs.length - maxVisibleTabs;

  return (
    <div className="flex items-center justify-between gap-0.5 border-b border-t border-border bg-bg-raised p-1">
      <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
        {visibleTabs.map((tab) => (
          <TerminalTab key={tab.name} name={tab.name} dotColor={tab.dotColor} active={tab.active} />
        ))}
        {hiddenTabCount > 0 && <OverflowBadge count={hiddenTabCount} />}
        <IconButton icon={Plus} size={12} ghost className="shrink-0" />
      </div>

      <div className="flex items-center gap-1">
        {commands.map((cmd) => (
          <QuickCommand key={cmd.label} label={cmd.label} />
        ))}
        {commandOverflowCount != null && commandOverflowCount > 0 && (
          <OverflowBadge count={commandOverflowCount} />
        )}
      </div>
    </div>
  );
}

export default TabBar;
