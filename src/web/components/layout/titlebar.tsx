import { Palette } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import IconButton from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";

const DRAG = { WebkitAppRegion: "drag" } as React.CSSProperties;
const NO_DRAG = { WebkitAppRegion: "no-drag" } as React.CSSProperties;

function Titlebar(): React.JSX.Element {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const onDesignSystem = pathname === "/design-system";

  return (
    <header className="flex h-[47px] shrink-0 items-center justify-end pr-3" style={DRAG}>
      {import.meta.env.DEV && (
        <IconButton
          icon={Palette}
          title="Design system"
          style={NO_DRAG}
          onClick={() => navigate(onDesignSystem ? "/" : "/design-system")}
          className={cn(onDesignSystem && "bg-active text-ink")}
        />
      )}
    </header>
  );
}

export default Titlebar;
