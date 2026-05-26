export function findScrollableAncestor(el: HTMLElement): HTMLElement | null {
  let parent: HTMLElement | null = el.parentElement;
  let outermost: HTMLElement | null = null;
  while (parent && parent !== document.body) {
    const style = getComputedStyle(parent);
    if (isScrollableOverflow(style.overflowX) || isScrollableOverflow(style.overflowY)) {
      outermost = parent;
    }
    parent = parent.parentElement;
  }
  return outermost;
}

function isScrollableOverflow(value: string): boolean {
  return value === 'auto' || value === 'scroll';
}
