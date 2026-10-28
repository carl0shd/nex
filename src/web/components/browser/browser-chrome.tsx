import { useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CursorPointer,
  Expand,
  Lock,
  MoreHoriz,
  OpenSelectHandGesture,
  Plus,
  Refresh,
  SmartphoneDevice,
  Xmark,
} from "iconoir-react";
import { IconButton } from "@/components/atoms/icon-button";
import { Orbit } from "@/components/atoms/orbit";
import { AnchoredPopover } from "@/components/primitives/anchored-popover";
import { BrowserMenu, type BrowserMenuProps } from "@/components/browser/browser-menu";
import { cn } from "@/lib/utils";

export interface BrowserTab {
  id: string;
  title: string;
}

function ChromeButton({
  label,
  pressed = false,
  onClick,
  children,
}: {
  label: string;
  pressed?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <IconButton size="sm" aria-label={label} pressed={pressed} onClick={onClick}>
      {children}
    </IconButton>
  );
}

export function BrowserTabs({
  tabs,
  active,
  onSelect,
  onClose,
  onNew,
  phone,
  onTogglePhone,
  onFullScreen,
  menu,
}: {
  tabs: readonly BrowserTab[];
  active: string;
  onSelect?: (id: string) => void;
  onClose?: (id: string) => void;
  onNew?: () => void;
  phone: boolean;
  onTogglePhone?: () => void;
  onFullScreen?: () => void;
  menu: BrowserMenuProps;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="flex h-[42px] shrink-0 items-center gap-1 px-2">
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <div
            key={tab.id}
            className={cn(
              "flex h-[30px] max-w-[220px] items-center gap-2 rounded-control pr-1.5 pl-2.5 text-xs",
              selected ? "bg-elevated text-ink shadow-tab" : "text-ink-3",
            )}
          >
            <button
              type="button"
              onClick={() => onSelect?.(tab.id)}
              className="interactive press-wide flex min-w-0 cursor-pointer items-center gap-2 select-none hover:text-ink"
            >
              <span className="size-3.5 shrink-0 rounded-[4px] bg-ink" />
              <span className="truncate">{tab.title}</span>
            </button>
            <button
              type="button"
              aria-label={`Close ${tab.title}`}
              onClick={() => onClose?.(tab.id)}
              className="interactive press flex size-5 cursor-pointer items-center justify-center rounded-[5px] text-ink-4 select-none hover:bg-hover hover:text-ink-2"
            >
              <Xmark width={11} height={11} strokeWidth={2.25} />
            </button>
          </div>
        );
      })}
      <ChromeButton label="New tab" onClick={onNew}>
        <Plus width={13} height={13} strokeWidth={2.25} />
      </ChromeButton>
      <span className="ml-auto flex items-center gap-0.5">
        <ChromeButton label="Phone viewport" pressed={phone} onClick={onTogglePhone}>
          <SmartphoneDevice width={13} height={13} strokeWidth={2} />
        </ChromeButton>
        <AnchoredPopover
          open={menuOpen}
          onOpenChange={setMenuOpen}
          side="bottom"
          align="end"
          trigger={
            <ChromeButton
              label="More"
              pressed={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <MoreHoriz width={14} height={14} strokeWidth={2} />
            </ChromeButton>
          }
        >
          <BrowserMenu {...menu} />
        </AnchoredPopover>
        <ChromeButton label="Full screen" onClick={onFullScreen}>
          <Expand width={13} height={13} strokeWidth={2} />
        </ChromeButton>
      </span>
    </div>
  );
}

function splitUrl(url: string) {
  try {
    const parsed = new URL(url);
    return { host: parsed.host, rest: `${parsed.pathname}${parsed.search}${parsed.hash}` };
  } catch {
    return { host: url, rest: "" };
  }
}

export function AddressBar({
  url,
  onNavigate,
  onBack,
  onForward,
  onReload,
  picking,
  onTogglePicker,
  onScreenshot,
}: {
  url: string;
  onNavigate?: (url: string) => void;
  onBack?: () => void;
  onForward?: () => void;
  onReload?: () => void;
  picking: boolean;
  onTogglePicker?: () => void;
  onScreenshot?: () => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const { host, rest } = splitUrl(url);
  return (
    <div className="flex h-10 shrink-0 items-center gap-1 px-2">
      <ChromeButton label="Back" onClick={onBack}>
        <ArrowLeft width={13} height={13} strokeWidth={2} />
      </ChromeButton>
      <ChromeButton label="Forward" onClick={onForward}>
        <ArrowRight width={13} height={13} strokeWidth={2} />
      </ChromeButton>
      <ChromeButton label="Reload" onClick={onReload}>
        <Refresh width={13} height={13} strokeWidth={2} />
      </ChromeButton>
      <label className="interactive flex h-[30px] min-w-0 flex-1 cursor-text items-center gap-2 rounded-control bg-field px-3 font-mono text-2xs shadow-[inset_0_0_0_1px_var(--line-chip)] focus-within:shadow-focus">
        <Lock width={11} height={11} strokeWidth={2} className="shrink-0 text-ink-4" />
        {draft === null ? (
          <button
            type="button"
            onClick={() => setDraft(url)}
            className="min-w-0 flex-1 cursor-text truncate text-left"
          >
            <span className="text-ink">{host}</span>
            <span className="text-ink-4">{rest}</span>
          </button>
        ) : (
          <input
            autoFocus
            aria-label="Address"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => setDraft(null)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onNavigate?.(draft);
                setDraft(null);
              }
              if (event.key === "Escape") setDraft(null);
            }}
            className="min-w-0 flex-1 bg-transparent text-ink outline-none"
          />
        )}
      </label>
      <ChromeButton label="Pick an element" pressed={picking} onClick={onTogglePicker}>
        <CursorPointer width={13} height={13} strokeWidth={2} />
      </ChromeButton>
      <ChromeButton label="Screenshot" onClick={onScreenshot}>
        <Camera width={13} height={13} strokeWidth={2} />
      </ChromeButton>
    </div>
  );
}

export function ClaudeBrowsingBanner({
  status,
  onTakeOver,
}: {
  status: string;
  onTakeOver?: () => void;
}) {
  return (
    <div
      role="status"
      className="enter-toast mx-2 mb-1.5 flex h-9 shrink-0 items-center gap-2.5 rounded-field bg-green/10 pr-1.5 pl-3 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--green)_22%,transparent)]"
    >
      <Orbit size="sm" />
      <span className="text-xs font-medium whitespace-nowrap text-accent-ink">
        Claude is using the browser
      </span>
      <span className="truncate text-xs text-ink-3">{status}</span>
      <button
        type="button"
        onClick={onTakeOver}
        className="interactive press ml-auto flex h-[26px] shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-2xs font-medium whitespace-nowrap text-ink-2 shadow-[inset_0_0_0_1px_var(--line-strong)] select-none hover:bg-hover hover:text-ink"
      >
        <OpenSelectHandGesture width={12} height={12} strokeWidth={2} />
        Take over
      </button>
    </div>
  );
}
