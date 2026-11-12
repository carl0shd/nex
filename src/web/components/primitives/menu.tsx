import type { ComponentType, ReactNode } from "react";
import { Check } from "lucide-react";
import GlideMenu from "@/components/primitives/glide-menu";
import { cn } from "@/lib/utils";

type MenuIcon = ComponentType<{ width?: number; height?: number; strokeWidth?: number }>;

export function Menu({
  children,
  header,
  footer,
  maxHeight,
  width = 300,
  origin = "top",
  className,
}: {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  maxHeight?: number;
  width?: number;
  origin?: "top" | "bottom left" | "bottom right";
  className?: string;
}) {
  const rows = <GlideMenu className="flex flex-col gap-0.5">{children}</GlideMenu>;
  return (
    <div
      role="menu"
      className={cn(
        "enter-pop flex flex-col rounded-menu bg-elevated p-1.5 shadow-overlay",
        className,
      )}
      style={{ width, transformOrigin: origin }}
    >
      {header}
      {maxHeight ? (
        <div className="menu-scroll -mr-1.5 overflow-y-auto pr-1.5" style={{ maxHeight }}>
          {rows}
        </div>
      ) : (
        rows
      )}
      {footer && (
        <div className="mt-1 shrink-0 border-t border-line pt-1">
          <GlideMenu className="flex flex-col gap-0.5">{footer}</GlideMenu>
        </div>
      )}
    </div>
  );
}

export function MenuLabel({
  children,
  trailing,
  className,
}: {
  children: ReactNode;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex h-6 items-center px-2.5 text-2xs text-ink-4", className)}>
      {children}
      {trailing && <span className="ml-auto">{trailing}</span>}
    </div>
  );
}

export function MenuSeparator() {
  return <div role="separator" className="m-1 h-px bg-line" />;
}

export function MenuItem({
  icon: Icon,
  children,
  meta,
  description,
  checked = false,
  danger = false,
  active = false,
  onSelect,
}: {
  icon?: MenuIcon;
  children: ReactNode;
  meta?: ReactNode;
  description?: ReactNode;
  checked?: boolean;
  danger?: boolean;
  active?: boolean;
  onSelect?: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      data-menu-row
      onClick={onSelect}
      className={cn(
        "interactive press-wide relative flex w-full cursor-pointer gap-2.5 rounded-control px-2.5 text-left text-sm select-none",
        description ? "items-start py-2" : "h-8 items-center",
        danger ? "text-red" : "text-ink",
        active && "bg-hover",
      )}
    >
      {Icon && (
        <span className={cn("flex text-ink-3", description && "pt-0.5")}>
          <Icon width={14} height={14} strokeWidth={2} />
        </span>
      )}
      {description ? (
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate">{children}</span>
          <span className="text-xs leading-4 text-ink-4">{description}</span>
        </span>
      ) : (
        <span className="flex-1 truncate">{children}</span>
      )}
      {meta && <span className="flex items-center gap-1.5 text-2xs text-ink-4">{meta}</span>}
      {checked && <Check width={13} height={13} strokeWidth={2.5} className="text-accent-ink" />}
    </button>
  );
}
