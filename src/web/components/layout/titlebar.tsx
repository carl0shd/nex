import { useState, type ReactNode } from "react";
import { PanelLeft, Settings2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { usePreferencesStore } from "@/stores/preferences.store";
import { useSettingsStore } from "@/stores/settings.store";
import { IconButton } from "@/components/atoms/icon-button";
import { SearchButton } from "@/components/layout/search-button";
import { useCommandPaletteStore } from "@/stores/command-palette.store";
import { useUsagePanelStore } from "@/stores/usage-panel.store";
import { UsagePill } from "@/components/layout/usage-pill";
import { AppUsagePanel } from "@/components/usage/app-usage-panel";
import { useAppHotkey } from "@/hooks/use-app-hotkey";
import { useLimitWarnings } from "@/hooks/use-limit-warnings";
import { useUsageSummary } from "@/hooks/use-usage-summary";
import { formatUsd, activeLimit } from "@/lib/usage";
import { AnchoredPopover } from "@/components/primitives/anchored-popover";
import { cn } from "@/lib/utils";

const DRAG = { WebkitAppRegion: "drag" } as React.CSSProperties;
const NO_DRAG = { WebkitAppRegion: "no-drag" } as React.CSSProperties;

type Usage = { percent: number; cost: string };

export function TitlebarView({
  collapsed = false,
  usage,
  usagePanel,
  defaultUsageOpen = false,
  usageOpen: controlledUsageOpen,
  onUsageOpenChange,
  settingsOpen = false,
  onToggleSidebar,
  onSearch,
  onSettings,
}: {
  collapsed?: boolean;
  usage?: Usage;
  usagePanel?: ReactNode;
  defaultUsageOpen?: boolean;
  usageOpen?: boolean;
  onUsageOpenChange?: (open: boolean) => void;
  settingsOpen?: boolean;
  onToggleSidebar?: () => void;
  onSearch?: () => void;
  onSettings?: () => void;
}) {
  const [ownUsageOpen, setOwnUsageOpen] = useState(defaultUsageOpen);
  const usageOpen = controlledUsageOpen ?? ownUsageOpen;
  const setUsageOpen = (open: boolean) => {
    setOwnUsageOpen(open);
    onUsageOpenChange?.(open);
  };
  return (
    <header className="flex h-12 w-full shrink-0 items-center pr-3" style={DRAG}>
      <span aria-hidden className="w-[66px] shrink-0" />
      <span className="ml-3.5 flex" style={NO_DRAG}>
        <IconButton
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={onToggleSidebar}
        >
          <PanelLeft width={15} height={15} strokeWidth={2} />
        </IconButton>
      </span>
      <span
        className={cn(
          "flex transition-[margin] duration-[250ms] ease-out-strong",
          collapsed ? "ml-2.5" : "ml-[162px]",
        )}
        style={NO_DRAG}
      >
        <SearchButton onClick={onSearch} />
      </span>
      <div className="ml-auto flex items-center gap-1.5" style={NO_DRAG}>
        {usage && (
          <AnchoredPopover
            open={usageOpen && Boolean(usagePanel)}
            onOpenChange={setUsageOpen}
            side="bottom"
            align="end"
            trigger={
              <UsagePill
                percent={usage.percent}
                cost={usage.cost}
                open={usageOpen && Boolean(usagePanel)}
                onClick={() => setUsageOpen(!usageOpen)}
              />
            }
          >
            {usagePanel}
          </AnchoredPopover>
        )}
        <IconButton
          aria-label="Settings"
          pressed={settingsOpen}
          onClick={onSettings}
          className="size-8"
        >
          <Settings2 width={15} height={15} strokeWidth={2} />
        </IconButton>
      </div>
    </header>
  );
}

function Titlebar(): React.JSX.Element {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const collapsed = useSettingsStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useSettingsStore((s) => s.toggleSidebar);
  const showPalette = useCommandPaletteStore((s) => s.show);
  const { summary, reload, refresh } = useUsageSummary();
  useLimitWarnings(summary, reload);
  const defaultAccount = summary?.accounts.find((account) => account.isDefault);
  const showUsage = usePreferencesStore((s) => s.prefs.showUsage);
  const onSettings = pathname === "/settings";
  const usageOpen = useUsagePanelStore((s) => s.open);
  const setUsageOpen = useUsagePanelStore((s) => s.setOpen);
  const toggleUsage = useUsagePanelStore((s) => s.toggle);
  useAppHotkey("settings", () => navigate(onSettings ? "/" : "/settings"));
  useAppHotkey("usage", toggleUsage, Boolean(summary && showUsage));

  return (
    <TitlebarView
      collapsed={collapsed}
      onSearch={showPalette}
      onToggleSidebar={toggleSidebar}
      settingsOpen={onSettings}
      onSettings={() => navigate(onSettings ? "/" : "/settings")}
      usageOpen={usageOpen}
      onUsageOpenChange={setUsageOpen}
      usage={
        summary && showUsage
          ? {
              percent: Math.round(
                (defaultAccount ? activeLimit(defaultAccount).percent : summary.worstPercent) ?? 0,
              ),
              cost: formatUsd(summary.today.total.costUsd),
            }
          : undefined
      }
      usagePanel={
        summary && (
          <AppUsagePanel summary={summary} onRefresh={() => void refresh()} onChanged={reload} />
        )
      }
    />
  );
}

export default Titlebar;
