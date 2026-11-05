import { useEffect, useRef, useState } from "react";

const MARGIN = "0px 640px";
const RELEASE_DELAY_MS = 300;

function scrollParent(node: HTMLElement): HTMLElement | null {
  for (let parent = node.parentElement; parent; parent = parent.parentElement) {
    const { overflowX, overflowY } = getComputedStyle(parent);
    if (/auto|scroll/.test(overflowX + overflowY)) return parent;
  }
  return null;
}

export function useNearViewport<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let release = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        clearTimeout(release);
        if (entry?.isIntersecting) setNear(true);
        else release = window.setTimeout(() => setNear(false), RELEASE_DELAY_MS);
      },
      { root: scrollParent(node), rootMargin: MARGIN },
    );
    observer.observe(node);
    return () => {
      clearTimeout(release);
      observer.disconnect();
    };
  }, []);

  return { ref, near };
}
