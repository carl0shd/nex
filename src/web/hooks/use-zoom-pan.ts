import { useEffect, useRef, useState } from "react";

export interface ZoomView {
  scale: number;
  x: number;
  y: number;
}

const MIN_SCALE = 1;
const MAX_SCALE = 8;
const DOUBLE_CLICK_SCALE = 2.5;
const WHEEL_SPEED = 0.003;
const PINCH_SPEED = 0.01;
const CLICK_AFTER_DRAG_MS = 250;
const AT_REST: ZoomView = { scale: 1, x: 0, y: 0 };

function zoomed(view: ZoomView, factor: number, point: { x: number; y: number }): ZoomView {
  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, view.scale * factor));
  if (scale <= MIN_SCALE) return AT_REST;
  const ratio = scale / view.scale;
  return {
    scale,
    x: point.x - (point.x - view.x) * ratio,
    y: point.y - (point.y - view.y) * ratio,
  };
}

function fromCenter(stage: HTMLElement, clientX?: number, clientY?: number) {
  const rect = stage.getBoundingClientRect();
  return {
    x: (clientX ?? rect.left + rect.width / 2) - (rect.left + rect.width / 2),
    y: (clientY ?? rect.top + rect.height / 2) - (rect.top + rect.height / 2),
  };
}

export function useZoomPan() {
  const stageRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<ZoomView>(AT_REST);
  const [view, setView] = useState<ZoomView>(AT_REST);
  const [smooth, setSmooth] = useState(false);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const draggedAt = useRef(0);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const commitFromEvent = (next: ZoomView, animate: boolean) => {
      viewRef.current = next;
      setSmooth(animate);
      setView(next);
    };
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const current = viewRef.current;
      const pinch = event.ctrlKey || event.metaKey;
      const point = fromCenter(stage, event.clientX, event.clientY);
      const factor = Math.exp(-event.deltaY * (pinch ? PINCH_SPEED : WHEEL_SPEED));
      const next = zoomed(current, factor, point);
      commitFromEvent(next.scale > 1 ? { ...next, x: next.x - event.deltaX } : next, false);
    };
    const onDoubleClick = (event: globalThis.MouseEvent) => {
      if (viewRef.current.scale > 1) return commitFromEvent(AT_REST, true);
      const point = fromCenter(stage, event.clientX, event.clientY);
      commitFromEvent(zoomed(AT_REST, DOUBLE_CLICK_SCALE, point), true);
    };
    const onPointerDown = (event: globalThis.PointerEvent) => {
      if (viewRef.current.scale <= 1) return;
      stage.setPointerCapture(event.pointerId);
      drag.current = { x: event.clientX, y: event.clientY };
      setDragging(true);
    };
    const onPointerMove = (event: globalThis.PointerEvent) => {
      const start = drag.current;
      if (!start) return;
      const current = viewRef.current;
      drag.current = { x: event.clientX, y: event.clientY };
      draggedAt.current = Date.now();
      commitFromEvent(
        {
          ...current,
          x: current.x + event.clientX - start.x,
          y: current.y + event.clientY - start.y,
        },
        false,
      );
    };
    const onPointerUp = () => {
      drag.current = null;
      setDragging(false);
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    stage.addEventListener("dblclick", onDoubleClick);
    stage.addEventListener("pointerdown", onPointerDown);
    stage.addEventListener("pointermove", onPointerMove);
    stage.addEventListener("pointerup", onPointerUp);
    stage.addEventListener("pointercancel", onPointerUp);
    return () => {
      stage.removeEventListener("wheel", onWheel);
      stage.removeEventListener("dblclick", onDoubleClick);
      stage.removeEventListener("pointerdown", onPointerDown);
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerup", onPointerUp);
      stage.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);

  const commit = (next: ZoomView, animate: boolean) => {
    viewRef.current = next;
    setSmooth(animate);
    setView(next);
  };

  const zoomBy = (factor: number) => {
    if (stageRef.current)
      commit(zoomed(viewRef.current, factor, fromCenter(stageRef.current)), true);
  };

  return {
    stageRef,
    view,
    smooth,
    dragging,
    zoomBy,
    reset: () => commit(AT_REST, true),
    justDragged: () => Date.now() - draggedAt.current < CLICK_AFTER_DRAG_MS,
  };
}
