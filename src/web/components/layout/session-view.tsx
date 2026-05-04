import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDndContext,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent
} from '@dnd-kit/core';
import { SortableContext, arrayMove, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import SessionPanel from '@/components/session/session-panel';
import SessionPanelChrome from '@/components/session/session-panel-chrome';
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
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragStart = (event: DragStartEvent): void => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent): void => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sessionIds.indexOf(String(active.id));
    const newIndex = sessionIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    const orderedIds = arrayMove(sessionIds, oldIndex, newIndex);
    reorderSessions(orderedIds);
  };

  const handleDragCancel = (): void => {
    setActiveId(null);
  };

  return (
    <div className="session-scroll flex-1 overflow-x-auto overflow-y-hidden px-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
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
