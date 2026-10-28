import type { ComponentType, ReactNode } from "react";
import GlideMenu from "@/components/primitives/glide-menu";

type RowIcon = ComponentType<{ width?: number; height?: number; strokeWidth?: number }>;

export function SessionPopover({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string;
  children: ReactNode;
}) {
  return (
    <div
      role="dialog"
      aria-label={title}
      className="enter-pop w-[300px] rounded-menu bg-elevated px-3 py-2.5 shadow-overlay"
    >
      <div className="flex h-[22px] items-center text-xs font-medium text-ink-3">
        {title}
        {meta && <span className="ml-auto font-normal text-ink-4">{meta}</span>}
      </div>
      <GlideMenu highlightClassName="-inset-x-1.5 rounded-control bg-hover">{children}</GlideMenu>
    </div>
  );
}

export function PopoverRow({
  leading,
  label,
  trailing,
  mono = false,
}: {
  leading: ReactNode;
  label: ReactNode;
  trailing?: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex h-[30px] min-w-0 items-center gap-2.5">
      <span className="flex w-5 shrink-0 justify-center text-ink-4">{leading}</span>
      <span className={mono ? "truncate font-mono text-xs text-ink" : "truncate text-sm text-ink"}>
        {label}
      </span>
      {trailing && <span className="ml-auto flex shrink-0 items-center gap-1.5">{trailing}</span>}
    </div>
  );
}

export function PopoverAction({
  icon: Icon,
  label,
  meta,
}: {
  icon: RowIcon;
  label: string;
  meta?: string;
}) {
  return (
    <button
      type="button"
      data-menu-row
      className="interactive press-wide relative flex h-[30px] w-full cursor-pointer items-center gap-2.5 text-left text-sm text-ink select-none"
    >
      <span className="flex w-5 justify-center text-ink-3">
        <Icon width={13} height={13} strokeWidth={2} />
      </span>
      {label}
      {meta && <span className="ml-auto text-2xs text-ink-4">{meta}</span>}
    </button>
  );
}

export function PopoverSeparator() {
  return <div className="my-1.5 h-px bg-line" />;
}
