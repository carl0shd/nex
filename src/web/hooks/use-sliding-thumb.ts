import { useLayoutEffect, useRef } from "react";

export function useSlidingThumb<C extends HTMLElement, T extends HTMLElement>(activeIndex: number) {
  const containerRef = useRef<C>(null);
  const thumbRef = useRef<T>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const thumb = thumbRef.current;
    if (!container || !thumb) return;
    const place = () => {
      const target = container.querySelectorAll<HTMLElement>("[data-thumb-item]")[activeIndex];
      if (!target) return;
      thumb.style.left = `${target.offsetLeft}px`;
      thumb.style.width = `${target.offsetWidth}px`;
      thumb.style.opacity = "1";
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(container);
    return () => observer.disconnect();
  }, [activeIndex]);

  return { containerRef, thumbRef };
}
