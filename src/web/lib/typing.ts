export function isTypingText(target: EventTarget | null): boolean {
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    return target.value.length > 0;
  }
  if (target instanceof HTMLElement && target.isContentEditable) {
    return (target.textContent ?? "").trim().length > 0;
  }
  return false;
}
