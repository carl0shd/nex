import { memo, useCallback, useMemo } from 'react';
import { Plus, Play, TerminalSquare } from 'lucide-react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortableList } from '@/hooks/use-sortable-list';
import type { SessionTab, QuickCommand as QuickCommandType } from '@/lib/session-view';
import SortableTerminalTab from '@/components/session/sortable-terminal-tab';
import TerminalTab from '@/components/session/terminal-tab';
import QuickCommand from '@/components/session/quick-command';
import OverflowBadge from '@/components/ui/overflow-badge';
import IconButton from '@/components/ui/icon-button';
import ActionMenu, { type ActionMenuAction } from '@/components/ui/action-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
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
  onReorderTabs?: (orderedIds: string[]) => void;
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
  onRunCommand,
  onReorderTabs
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
  const hiddenTabActions = useMemo<ActionMenuAction[]>(
    () =>
      hiddenTabs.map((tab) => ({
        label: tab.name,
        icon: TerminalSquare,
        onClick: () => onSelectTab?.(tab.id)
      })),
    [hiddenTabs, onSelectTab]
  );

  const tabIds = useMemo(() => tabs.map((t) => t.id), [tabs]);
  const visibleTabIds = useMemo(() => visibleTabs.map((t) => t.id), [visibleTabs]);

  const handleReorder = useCallback(
    (orderedIds: string[]): void => onReorderTabs?.(orderedIds),
    [onReorderTabs]
  );
  const { activeId, dndContextProps } = useSortableList(tabIds, handleReorder);
  const draggingTab = tabs.find((t) => t.id === activeId);

  const visibleCommands = commands.slice(0, maxVisibleCommands);
  const hiddenCommands = commands.slice(maxVisibleCommands);

  const hiddenCommandActions = useMemo<ActionMenuAction[]>(
    () =>
      hiddenCommands.map((cmd) => ({
        label: cmd.label,
        icon: Play,
        iconClassName: 'text-green',
        onClick: () => onRunCommand?.(cmd)
      })),
    [hiddenCommands, onRunCommand]
  );

  return (
    <div className="flex h-10 shrink-0 items-center gap-1 border-b border-line-soft px-2">
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <DndContext {...dndContextProps}>
          <SortableContext items={visibleTabIds} strategy={horizontalListSortingStrategy}>
            {visibleTabs.map((tab) => (
              <SortableTerminalTab
                key={tab.id}
                tab={tab}
                onClick={() => onSelectTab?.(tab.id)}
                onClose={() => onCloseTab?.(tab.id)}
              />
            ))}
          </SortableContext>
          <DragOverlay>
            {draggingTab && (
              <TerminalTab
                name={draggingTab.name}
                status={draggingTab.status}
                active={draggingTab.active}
                dragging
              />
            )}
          </DragOverlay>
        </DndContext>
        {hiddenTabs.length > 0 && (
          <ActionMenu
            trigger={<OverflowBadge count={hiddenTabs.length} />}
            actions={hiddenTabActions}
          />
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton icon={Plus} size={13} title="New terminal" className="size-6 shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {agentName && (
              <DropdownMenuItem onSelect={onAddAgentTab}>
                <AgentIcon slug={agentSlug} size={13} />
                {agentName}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={onAddShellTab}>
              <TerminalSquare size={13} />
              Shell
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {visibleCommands.map((cmd) => (
          <QuickCommand key={cmd.label} label={cmd.label} onClick={() => onRunCommand?.(cmd)} />
        ))}
        {hiddenCommands.length > 0 && (
          <ActionMenu
            trigger={<OverflowBadge count={hiddenCommands.length} />}
            actions={hiddenCommandActions}
          />
        )}
      </div>
    </div>
  );
}

export default memo(TabBar);
