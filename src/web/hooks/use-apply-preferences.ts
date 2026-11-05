import { useEffect } from "react";
import { ZOOM, motionClass } from "@/lib/preferences";
import { usePermissionStore } from "@/stores/permission.store";
import { usePreferencesStore } from "@/stores/preferences.store";

export function useApplyPreferences() {
  const interfaceSize = usePreferencesStore((s) => s.prefs.interfaceSize);
  const reduceTransparency = usePreferencesStore((s) => s.prefs.reduceTransparency);
  const motion = usePreferencesStore((s) => s.prefs.motion);
  const dockBadge = usePreferencesStore((s) => s.prefs.dockBadge);
  const waiting = usePermissionStore((s) => new Set(s.requests.map((r) => r.sessionId)).size);

  useEffect(() => window.api.setZoomFactor(ZOOM[interfaceSize]), [interfaceSize]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("reduce-transparency", reduceTransparency);
    root.classList.toggle("motion-reduce", motionClass(motion) !== null);
  }, [reduceTransparency, motion]);

  useEffect(() => {
    void window.api.setDockBadge(dockBadge ? waiting : 0);
  }, [dockBadge, waiting]);
}
