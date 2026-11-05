import { useEffect, useRef } from "react";

const EDITABLE = "input, textarea, select, [contenteditable='true']";
const OPEN_LAYER = "[role='dialog'], [role='menu'], [aria-modal='true']";

function typesText(event: KeyboardEvent) {
  if (event.defaultPrevented || event.isComposing) return false;
  if (event.metaKey || event.ctrlKey || event.altKey) return false;
  if (event.key.length !== 1) return false;
  const target = event.target instanceof Element ? event.target : null;
  if (target?.closest(EDITABLE)) return false;
  if (event.key === " " && target && target !== document.body) return false;
  return !document.querySelector(OPEN_LAYER);
}

export function useTypeToFocus(enabled: boolean, focus: () => void) {
  const latest = useRef(focus);
  useEffect(() => {
    latest.current = focus;
  });

  useEffect(() => {
    if (!enabled) return;
    // Moving focus during keydown makes Chromium deliver the typed character to the editor.
    const onKeyDown = (event: KeyboardEvent) => {
      if (typesText(event)) latest.current();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
