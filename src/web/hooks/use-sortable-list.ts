import { useCallback, useState } from 'react';
import {
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DndContextProps,
  type DragEndEvent,
  type DragStartEvent
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

const ACTIVATION_DISTANCE = 5;

interface SortableList {
  activeId: string | null;
  dndContextProps: Pick<
    DndContextProps,
    'sensors' | 'collisionDetection' | 'onDragStart' | 'onDragEnd' | 'onDragCancel'
  >;
}

export function useSortableList(
  ids: string[],
  onReorder: (orderedIds: string[]) => void
): SortableList {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: ACTIVATION_DISTANCE } })
  );

  const onDragStart = useCallback((event: DragStartEvent): void => {
    setActiveId(String(event.active.id));
  }, []);

  const onDragCancel = useCallback((): void => setActiveId(null), []);

  const onDragEnd = useCallback(
    (event: DragEndEvent): void => {
      setActiveId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = ids.indexOf(String(active.id));
      const newIndex = ids.indexOf(String(over.id));
      if (oldIndex < 0 || newIndex < 0) return;

      onReorder(arrayMove(ids, oldIndex, newIndex));
    },
    [ids, onReorder]
  );

  return {
    activeId,
    dndContextProps: {
      sensors,
      collisionDetection: closestCenter,
      onDragStart,
      onDragEnd,
      onDragCancel
    }
  };
}
