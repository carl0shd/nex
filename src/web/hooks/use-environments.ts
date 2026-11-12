import { useEffect } from "react";
import { useEnvironmentsStore } from "@/stores/environments.store";

const REFRESH_MS = 20_000;

export function useEnvironments(): void {
  const load = useEnvironmentsStore((s) => s.load);
  const refresh = useEnvironmentsStore((s) => s.refresh);
  const enabled = useEnvironmentsStore((s) => s.status?.enabled ?? false);
  useEffect(() => load(), [load]);
  useEffect(() => {
    if (!enabled) return;
    const timer = setInterval(() => void refresh(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [enabled, refresh]);
}
