import { useCallback, type MutableRefObject, type Ref } from 'react';

export function useMergedRef<T>(...refs: (Ref<T> | undefined)[]): (node: T | null) => void {
  return useCallback(
    (node: T | null) => {
      for (const ref of refs) {
        if (!ref) continue;
        if (typeof ref === 'function') ref(node);
        else (ref as MutableRefObject<T | null>).current = node;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    refs
  );
}
