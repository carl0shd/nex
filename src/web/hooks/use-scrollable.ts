import { useEffect, useRef, useState } from 'react';
import type SimpleBarCore from 'simplebar-core';

export function useScrollable(): [React.RefObject<SimpleBarCore | null>, boolean] {
  const ref = useRef<SimpleBarCore>(null);
  const [scrollable, setScrollable] = useState(false);

  useEffect(() => {
    const instance = ref.current;
    if (!instance) return;

    const wrapper = instance.getScrollElement();
    if (!wrapper) return;

    const check = (): void => {
      const isScrollable = wrapper.scrollHeight > wrapper.clientHeight;
      setScrollable((prev) => (prev === isScrollable ? prev : isScrollable));
    };

    check();
    const observer = new ResizeObserver(check);
    observer.observe(wrapper);

    return (): void => observer.disconnect();
  }, []);

  return [ref, scrollable];
}
