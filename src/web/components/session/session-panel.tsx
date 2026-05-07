import { memo, useCallback, useMemo, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import SessionPanelChrome from '@/components/session/session-panel-chrome';
import { useNearViewport } from '@/hooks/use-near-viewport';

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

  const localRef = useRef<HTMLDivElement | null>(null);
  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      setNodeRef(node);
      localRef.current = node;
    },
    [setNodeRef]
  );

  const nearViewport = useNearViewport(localRef);

  const transformStr = CSS.Transform.toString(transform);
  const style = useMemo(
    () => ({ transform: transformStr, transition, opacity: isDragging ? 0 : 1 }),
    [transformStr, transition, isDragging]
  );

  return (
    <SessionPanelChrome
      sessionId={sessionId}
      containerRef={setRef}
      containerStyle={style}
      dragRef={setActivatorNodeRef}
      dragAttributes={attributes}
      dragListeners={listeners}
      nearViewport={nearViewport}
    />
  );
}

export default memo(SessionPanel);
