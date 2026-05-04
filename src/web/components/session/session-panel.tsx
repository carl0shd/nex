import { memo, useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import SessionPanelChrome from '@/components/session/session-panel-chrome';

interface SessionPanelProps {
  sessionId: string;
}

function SessionPanel({ sessionId }: SessionPanelProps): React.JSX.Element {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: sessionId });

  const transformStr = CSS.Transform.toString(transform);
  const style = useMemo(
    () => ({ transform: transformStr, transition, opacity: isDragging ? 0 : 1 }),
    [transformStr, transition, isDragging]
  );

  return (
    <SessionPanelChrome
      sessionId={sessionId}
      containerRef={setNodeRef}
      containerStyle={style}
      dragRef={setActivatorNodeRef}
      dragAttributes={attributes}
      dragListeners={listeners}
    />
  );
}

export default memo(SessionPanel);
