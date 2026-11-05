import { useRef, type MouseEvent } from "react";

const DOUBLE_CLICK_MS = 220;
const CLICKABLE =
  "button, a, input, textarea, select, label, summary, img, [contenteditable='true'], [role='button'], [role='switch'], [role='radio'], [role='checkbox'], [role='menu'], [data-menu-row], [tabindex], .cursor-pointer";

export const isClickable = (target: EventTarget | null) =>
  !(target instanceof Element) || Boolean(target.closest(CLICKABLE));

export function useEmptyClick(onEmptyClick: () => void) {
  const lastClick = useRef(0);
  return (event: MouseEvent) => {
    const click = ++lastClick.current;
    if (isClickable(event.target)) return;
    setTimeout(() => {
      const selecting = window.getSelection()?.isCollapsed === false;
      if (click === lastClick.current && !selecting) onEmptyClick();
    }, DOUBLE_CLICK_MS);
  };
}
