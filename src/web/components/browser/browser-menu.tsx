import { ChevronRight } from "lucide-react";
import { Menu, MenuItem, MenuLabel, MenuSeparator } from "@/components/primitives/menu";

export interface BrowserMenuProps {
  externalBrowser: string;
  viewport: string;
  claudeCanUse: boolean;
  openTaskLinks: boolean;
  keepCookies: string;
  onOpenExternal?: () => void;
  onCopyUrl?: () => void;
  onSaveScreenshot?: () => void;
  onViewport?: () => void;
  onDevServerLogs?: () => void;
  onClaudeCanUseChange?: (enabled: boolean) => void;
  onOpenTaskLinksChange?: (enabled: boolean) => void;
  onAllowedSites?: () => void;
  onImportCookies?: () => void;
  onKeepCookies?: () => void;
  onClearData?: () => void;
}

function Submenu({ value }: { value: string }) {
  return (
    <>
      <span className="text-xs">{value}</span>
      <ChevronRight width={11} height={11} strokeWidth={2} />
    </>
  );
}

export function BrowserMenu(props: BrowserMenuProps) {
  return (
    <Menu width={290}>
      <MenuItem onSelect={props.onOpenExternal}>Open in {props.externalBrowser}</MenuItem>
      <MenuItem onSelect={props.onCopyUrl}>Copy URL</MenuItem>
      <MenuItem onSelect={props.onSaveScreenshot}>Save screenshot</MenuItem>
      <MenuSeparator />
      <MenuItem meta={<Submenu value={props.viewport} />} onSelect={props.onViewport}>
        Viewport
      </MenuItem>
      <MenuItem onSelect={props.onDevServerLogs}>Dev server logs</MenuItem>
      <MenuSeparator />
      <MenuItem
        checked={props.claudeCanUse}
        onSelect={() => props.onClaudeCanUseChange?.(!props.claudeCanUse)}
      >
        Claude can use this browser
      </MenuItem>
      <MenuItem
        checked={props.openTaskLinks}
        onSelect={() => props.onOpenTaskLinksChange?.(!props.openTaskLinks)}
      >
        Open task links here
      </MenuItem>
      <MenuItem onSelect={props.onAllowedSites}>Allowed sites…</MenuItem>
      <MenuSeparator />
      <MenuLabel>Cookies</MenuLabel>
      <MenuItem onSelect={props.onImportCookies}>Import from Chrome…</MenuItem>
      <MenuItem meta={<Submenu value={props.keepCookies} />} onSelect={props.onKeepCookies}>
        Keep cookies
      </MenuItem>
      <MenuItem danger onSelect={props.onClearData}>
        Clear browsing data
      </MenuItem>
    </Menu>
  );
}
