import { useState, type ReactNode } from "react";
import { Palette, SidebarCollapse, Settings } from "iconoir-react";
import { useLocation, useNavigate } from "react-router";
import { IconButton } from "@/components/atoms/icon-button";
import { SearchButton } from "@/components/layout/search-button";
import { UsagePill } from "@/components/layout/usage-pill";
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
  onToggleSidebar,
  onSearch,
  trailing,
}: {
  collapsed?: boolean;
  usage?: Usage;
  usagePanel?: ReactNode;
  defaultUsageOpen?: boolean;
  onToggleSidebar?: () => void;
  onSearch?: () => void;
  trailing?: ReactNode;
}) {
  const [usageOpen, setUsageOpen] = useState(defaultUsageOpen);
  return (
    <header className="flex h-12 w-full shrink-0 items-center pr-3" style={DRAG}>
      <span aria-hidden className="w-[66px] shrink-0" />
      <span className="ml-1.5 flex" style={NO_DRAG}>
        <IconButton
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={onToggleSidebar}
        >
          <SidebarCollapse width={15} height={15} strokeWidth={2} />
        </IconButton>
      </span>
      <span className={cn("flex", collapsed ? "ml-2.5" : "ml-[170px]")} style={NO_DRAG}>
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
                onClick={() => setUsageOpen((open) => !open)}
              />
            }
          >
            {usagePanel}
          </AnchoredPopover>
        )}
        {trailing}
        <IconButton aria-label="Settings" className="size-8">
          <Settings width={15} height={15} strokeWidth={2} />
        </IconButton>
      </div>
    </header>
  );
}

function Titlebar(): React.JSX.Element {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const onDesignSystem = pathname === "/design-system";

  return (
    <TitlebarView
      trailing={
        import.meta.env.DEV && (
          <IconButton
            aria-label="Design system"
            pressed={onDesignSystem}
            onClick={() => navigate(onDesignSystem ? "/" : "/design-system")}
          >
            <Palette width={14} height={14} strokeWidth={2} />
          </IconButton>
        )
      }
    />
  );
}

export default Titlebar;
