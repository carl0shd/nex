import type { CSSProperties } from "react";
import { SIDEBAR_WIDTH, TITLEBAR_HEIGHT } from "@/lib/app-chrome";
import { useSettingsStore } from "@/stores/settings.store";

export function ChromeGlass() {
  const collapsed = useSettingsStore((s) => s.sidebarCollapsed);
  const sidebar = collapsed ? SIDEBAR_WIDTH.rail : SIDEBAR_WIDTH.open;
  return (
    <div
      aria-hidden
      className="chrome-glass pointer-events-none absolute inset-0 bg-page-glass backdrop-blur-[28px] backdrop-saturate-[1.2]"
      style={{ "--titlebar": `${TITLEBAR_HEIGHT}px`, "--sidebar": `${sidebar}px` } as CSSProperties}
    />
  );
}
