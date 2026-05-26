import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import SessionPanelChrome, {
  DEFAULT_SESSION_WIDTH
} from '@/components/session/session-panel-chrome';
import { useNearViewport } from '@/hooks/use-near-viewport';
import { useSessionStore } from '@/stores/session.store';

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

  const [nearViewport, setNearNode] = useNearViewport();
  const localContainerRef = useRef<HTMLDivElement | null>(null);

  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      localContainerRef.current = node;
      setNodeRef(node);
      setNearNode(node);
    },
    [setNodeRef, setNearNode]
  );

  const pendingFocusSessionId = useSessionStore((s) => s.pendingFocusSessionId);

  useEffect(() => {
    if (pendingFocusSessionId !== sessionId) return;
    localContainerRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center'
    });
  }, [pendingFocusSessionId, sessionId]);

  const sessionWidth = useSessionStore(
    (s) => s.sessions.find((sess) => sess.id === sessionId)?.width ?? DEFAULT_SESSION_WIDTH
  );

  const transformStr = CSS.Transform.toString(transform);
  const style = useMemo(
    () => ({ transform: transformStr, transition, opacity: isDragging ? 0 : 1 }),
    [transformStr, transition, isDragging]
  );

  if (!nearViewport) {
    return (
      <div
        ref={setRef}
        style={{ ...style, width: sessionWidth }}
        className="h-full shrink-0"
        {...attributes}
      />
    );
  }

  return (
    <SessionPanelChrome
      sessionId={sessionId}
      containerRef={setRef}
      containerStyle={style}
      dragRef={setActivatorNodeRef}
      dragAttributes={attributes}
      dragListeners={listeners}
    />
  );
}

export default memo(SessionPanel);
