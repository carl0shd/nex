import { memo, useMemo } from 'react';
import { Plus, Play, TerminalSquare } from 'lucide-react';
import type { SessionTab, QuickCommand as QuickCommandType } from '@/lib/session-view';
import TerminalTab from '@/components/session/terminal-tab';
import QuickCommand from '@/components/session/quick-command';
import OverflowBadge from '@/components/ui/overflow-badge';
import IconButton from '@/components/ui/icon-button';
import ContextMenu, { type ContextMenuAction } from '@/components/ui/context-menu';
import Popover from '@/components/ui/popover';
import AgentIcon from '@/components/ui/agent-icon';

interface TabBarProps {
  tabs: SessionTab[];
  commands: QuickCommandType[];
  maxVisibleTabs?: number;
  maxVisibleCommands?: number;
  agentName?: string;
  agentSlug?: string;
  onSelectTab?: (id: string) => void;
  onCloseTab?: (id: string) => void;
  onAddAgentTab?: () => void;
  onAddShellTab?: () => void;
  onRunCommand?: (command: QuickCommandType) => void;
}

function TabBar({
  tabs,
  commands,
  maxVisibleTabs = 3,
  maxVisibleCommands = 2,
  agentName,
  agentSlug,
  onSelectTab,
  onCloseTab,
  onAddAgentTab,
  onAddShellTab,
  onRunCommand
}: TabBarProps): React.JSX.Element {
  const visibleTabs = useMemo(() => {
    if (tabs.length <= maxVisibleTabs) return tabs;
    const head = tabs.slice(0, maxVisibleTabs);
    const activeTab = tabs.find((t) => t.active);
    if (!activeTab || head.includes(activeTab)) return head;
    return [...tabs.slice(0, maxVisibleTabs - 1), activeTab];
  }, [tabs, maxVisibleTabs]);

  const hiddenTabs = useMemo(
    () => tabs.filter((t) => !visibleTabs.includes(t)),
    [tabs, visibleTabs]
  );
  const hiddenTabActions = useMemo<ContextMenuAction[]>(
    () =>
      hiddenTabs.map((tab) => ({
        label: tab.name,
        icon: TerminalSquare,
        onClick: () => onSelectTab?.(tab.id)
      })),
    [hiddenTabs, onSelectTab]
  );

  const visibleCommands = commands.slice(0, maxVisibleCommands);
  const hiddenCommands = commands.slice(maxVisibleCommands);

  const hiddenCommandActions = useMemo<ContextMenuAction[]>(
    () =>
      hiddenCommands.map((cmd) => ({
        label: cmd.label,
        icon: Play,
        iconClassName: 'text-badge-success-text',
        onClick: () => onRunCommand?.(cmd)
      })),
    [hiddenCommands, onRunCommand]
  );

  return (
    <div className="flex h-9 shrink-0 items-center gap-1 border-b border-border-soft bg-bg-soft px-1">
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        {visibleTabs.map((tab) => (
          <TerminalTab
            key={tab.id}
            name={tab.name}
            dotColor={tab.dotColor}
            active={tab.active}
            onClick={() => onSelectTab?.(tab.id)}
            onClose={() => onCloseTab?.(tab.id)}
          />
        ))}
        {hiddenTabs.length > 0 && (
          <ContextMenu
            trigger={<OverflowBadge count={hiddenTabs.length} />}
            actions={hiddenTabActions}
          />
        )}
        <Popover
          anchor="bottom start"
          gap={4}
          trigger={<IconButton icon={Plus} size={12} variant="ghost" className="shrink-0" />}
          className="flex w-45 flex-col rounded-lg border border-border-menu bg-bg-menu p-1 shadow-lg"
        >
          {({ close }) => (
            <>
              {agentName && (
                <button
                  onClick={() => {
                    close();
                    onAddAgentTab?.();
                  }}
                  className="flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-text-secondary select-none hover:bg-bg-mute"
                >
                  <AgentIcon slug={agentSlug} size={13} className="shrink-0" />
                  <span className="text-[12px]">{agentName}</span>
                </button>
              )}
              <button
                onClick={() => {
                  close();
                  onAddShellTab?.();
                }}
                className="flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-text-secondary select-none hover:bg-bg-mute"
              >
                <TerminalSquare size={13} className="shrink-0 text-text-muted" />
                <span className="text-[12px]">Shell</span>
              </button>
            </>
          )}
        </Popover>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {visibleCommands.map((cmd) => (
          <QuickCommand key={cmd.label} label={cmd.label} onClick={() => onRunCommand?.(cmd)} />
        ))}
        {hiddenCommands.length > 0 && (
          <ContextMenu
            trigger={<OverflowBadge count={hiddenCommands.length} />}
            actions={hiddenCommandActions}
          />
        )}
      </div>
    </div>
  );
}

export default memo(TabBar);
