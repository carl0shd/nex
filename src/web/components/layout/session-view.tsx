import { DndContext, DragOverlay, useDndContext } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import SessionPanel from '@/components/session/session-panel';
import SessionPanelChrome from '@/components/session/session-panel-chrome';
import { useSortableList } from '@/hooks/use-sortable-list';
import { useSessionStore } from '@/stores/session.store';

interface SessionViewProps {
  sessionIds: string[];
}

function SessionList({ sessionIds }: { sessionIds: string[] }): React.JSX.Element {
  const { active } = useDndContext();
  return (
    <div className="flex h-full gap-3 py-3">
      {sessionIds.map((id) => (
        <SessionPanel key={id} sessionId={id} />
      ))}
      {active && <div className="w-150 shrink-0" aria-hidden />}
    </div>
  );
}

function SessionView({ sessionIds }: SessionViewProps): React.JSX.Element {
  const reorderSessions = useSessionStore((s) => s.reorderSessions);
  const { activeId, dndContextProps } = useSortableList(sessionIds, reorderSessions);

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden px-3">
      <DndContext {...dndContextProps}>
        <SortableContext items={sessionIds} strategy={horizontalListSortingStrategy}>
          <SessionList sessionIds={sessionIds} />
        </SortableContext>
        <DragOverlay>
          {activeId ? (
            <SessionPanelChrome sessionId={activeId} extraClassName="shadow-2xl" />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

export default SessionView;
