import type { ReactNode } from "react";
import {
  AddressBar,
  BrowserTabs,
  ClaudeBrowsingBanner,
  type BrowserTab,
} from "@/components/browser/browser-chrome";
import type { BrowserMenuProps } from "@/components/browser/browser-menu";
import { BrowserViewport, type ViewportDevice } from "@/components/browser/browser-viewport";

export function BrowserPanel({
  tabs,
  activeTab,
  url,
  device,
  onDeviceChange,
  picking,
  onPickingChange,
  claudeStatus,
  onTakeOver,
  menu,
  overlay,
  children,
}: {
  tabs: readonly BrowserTab[];
  activeTab: string;
  url: string;
  device: ViewportDevice;
  onDeviceChange: (device: ViewportDevice) => void;
  picking: boolean;
  onPickingChange: (picking: boolean) => void;
  claudeStatus?: string;
  onTakeOver?: () => void;
  menu: BrowserMenuProps;
  overlay?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <BrowserTabs
        tabs={tabs}
        active={activeTab}
        phone={device === "phone"}
        onTogglePhone={() => onDeviceChange(device === "phone" ? "desktop" : "phone")}
        menu={menu}
      />
      <AddressBar url={url} picking={picking} onTogglePicker={() => onPickingChange(!picking)} />
      {claudeStatus && <ClaudeBrowsingBanner status={claudeStatus} onTakeOver={onTakeOver} />}
      <BrowserViewport device={device} driving={Boolean(claudeStatus)} overlay={overlay}>
        {children}
      </BrowserViewport>
    </div>
  );
}
