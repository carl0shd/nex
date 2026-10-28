import { useState } from "react";
import { Copy, NavArrowLeft, NavArrowRight, OpenNewWindow, Xmark } from "iconoir-react";
import { Button } from "@/components/atoms/button";
import { IconButton } from "@/components/atoms/icon-button";
import { SearchField } from "@/components/atoms/search-field";
import { ValuePill } from "@/components/atoms/value-pill";
import GlideMenu from "@/components/primitives/glide-menu";

export interface PackageLicense {
  name: string;
  version: string;
  license: string;
  url?: string;
  text: string;
}

export function LicenseSheet({ item, onClose }: { item: PackageLicense; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <div
      role="dialog"
      aria-label={`${item.name} license`}
      className="enter-pop relative h-fit w-[560px] overflow-hidden rounded-panel bg-surface-raised shadow-modal"
      style={{ transformOrigin: "top center" }}
    >
      <div className="flex h-14 items-center gap-2 border-b border-line pr-3 pl-5">
        <span className="text-base font-semibold text-ink">{item.name}</span>
        <span className="font-mono text-2xs text-ink-4">{item.version}</span>
        <ValuePill>{item.license}</ValuePill>
        <span className="ml-auto" />
        <Button
          variant="quiet"
          size="sm"
          onClick={() => {
            void navigator.clipboard?.writeText(item.text);
            setCopied(true);
          }}
        >
          <Copy width={12} height={12} strokeWidth={2} />
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button
          variant="quiet"
          size="sm"
          onClick={() => window.open(`https://www.npmjs.com/package/${item.name}`, "_blank")}
        >
          <OpenNewWindow width={12} height={12} strokeWidth={2} />
          npm
        </Button>
        <IconButton aria-label="Close" size="sm" onClick={onClose}>
          <Xmark width={14} height={14} strokeWidth={2} />
        </IconButton>
      </div>
      <pre className="m-0 max-h-[460px] overflow-auto px-5 py-4 font-mono text-2xs leading-[18px] whitespace-pre-wrap text-ink-2 select-text">
        {item.text}
      </pre>
    </div>
  );
}

export function LicensesView({
  packages,
  onBack,
  onOpen,
}: {
  packages: readonly PackageLicense[];
  onBack?: () => void;
  onOpen: (item: PackageLicense) => void;
}) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const shown = needle
    ? packages.filter((item) => `${item.name} ${item.license}`.toLowerCase().includes(needle))
    : packages;

  return (
    <div className="flex w-[680px] flex-col">
      <button
        type="button"
        onClick={onBack}
        className="interactive press -ml-1 flex w-fit cursor-pointer items-center gap-1 rounded-control px-1 text-sm text-ink-3 select-none hover:text-ink"
      >
        <NavArrowLeft width={13} height={13} strokeWidth={2} />
        Settings
      </button>
      <h1 className="m-0 mt-5 text-2xl font-semibold tracking-[-0.025em] text-ink">
        Open source licenses
      </h1>
      <p className="m-0 mt-1.5 text-sm text-ink-3">
        Nex ships with {packages.length} open source packages. Thanks to everyone who builds them.
      </p>
      <SearchField
        value={query}
        onChange={setQuery}
        placeholder="Search packages"
        className="mt-4"
      />
      <div className="mt-4 overflow-hidden rounded-panel bg-surface shadow-card">
        {shown.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-sm text-ink-4">
            No packages match “{query.trim()}”
          </div>
        ) : (
          <GlideMenu
            className="flex flex-col [&>button+button]:border-t [&>button+button]:border-line"
            highlightClassName="inset-x-0 bg-hover"
          >
            {shown.map((item) => (
              <button
                key={item.name}
                type="button"
                data-menu-row
                onClick={() => onOpen(item)}
                className="interactive relative flex h-[45px] w-full cursor-pointer items-center gap-2.5 px-4 text-left select-none"
              >
                <span className="text-sm font-medium text-ink">{item.name}</span>
                <span className="font-mono text-2xs text-ink-4">{item.version}</span>
                <span className="ml-auto text-xs text-ink-3">{item.license}</span>
                <NavArrowRight width={12} height={12} strokeWidth={2} className="text-ink-4" />
              </button>
            ))}
          </GlideMenu>
        )}
      </div>
    </div>
  );
}
