import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';

interface Options {
  min?: number;
  max?: number;
  onCommit?: (width: number) => void;
}

interface DragState {
  startX: number;
  startWidth: number;
  current: number;
}

export function useResizableWidth(
  initialWidth: number,
  options: Options = {}
): {
  width: number;
  onPointerDown: (e: PointerEvent) => void;
  isDragging: boolean;
} {
  const { min = 320, max = 1600, onCommit } = options;
  const [dragWidth, setDragWidth] = useState<number | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const onCommitRef = useRef(onCommit);

  useEffect(() => {
    onCommitRef.current = onCommit;
  }, [onCommit]);

  const width = dragWidth ?? initialWidth;
  const isDragging = dragWidth !== null;

  const onPointerDown = useCallback(
    (e: PointerEvent) => {
      e.preventDefault();
      dragRef.current = { startX: e.clientX, startWidth: initialWidth, current: initialWidth };
      setDragWidth(initialWidth);

      const handleMove = (ev: globalThis.PointerEvent): void => {
        if (!dragRef.current) return;
        const delta = ev.clientX - dragRef.current.startX;
        const next = Math.max(min, Math.min(max, dragRef.current.startWidth + delta));
        dragRef.current.current = next;
        setDragWidth(next);
      };

      const handleUp = (): void => {
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleUp);
        const final = dragRef.current?.current ?? initialWidth;
        dragRef.current = null;
        setDragWidth(null);
        onCommitRef.current?.(final);
      };

      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
    },
    [initialWidth, min, max]
  );

  return { width, onPointerDown, isDragging };
}
