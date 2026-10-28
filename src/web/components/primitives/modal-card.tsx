import type { ComponentType, ReactNode } from "react";
import { Xmark } from "iconoir-react";
import { IconButton } from "@/components/atoms/icon-button";
import { cn } from "@/lib/utils";

type StatusTone = "green" | "orange" | "red";

const STATUS: Record<StatusTone, string> = {
  green: "bg-green-tint text-green",
  orange: "bg-orange-tint text-orange",
  red: "bg-red-tint text-red",
};

export function StatusIcon({
  tone,
  icon: Icon,
}: {
  tone: StatusTone;
  icon: ComponentType<{ width?: number; height?: number; strokeWidth?: number }>;
}) {
  return (
    <span
      className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", STATUS[tone])}
    >
      <Icon width={15} height={15} strokeWidth={2.5} />
    </span>
  );
}

export function ModalCard({
  title,
  description,
  icon,
  footer,
  children,
  onClose,
  className,
}: {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  onClose?: () => void;
  className?: string;
}) {
  return (
    <div
      role="dialog"
      aria-label={title}
      className={cn(
        "enter-pop w-[440px] origin-center overflow-hidden rounded-panel bg-surface-raised shadow-modal",
        className,
      )}
    >
      <div className="flex items-start gap-3 px-[18px] pt-[18px]">
        {icon}
        <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <h2 className="m-0 text-md font-semibold tracking-[-0.015em] text-ink">{title}</h2>
          {description && <p className="m-0 text-sm leading-[19px] text-ink-3">{description}</p>}
        </div>
        <IconButton aria-label="Close" size="sm" onClick={onClose} className="-mt-[3px] -mr-1">
          <Xmark width={14} height={14} strokeWidth={2} />
        </IconButton>
      </div>
      {children && <div className="px-[18px] pt-4 pb-[18px]">{children}</div>}
      {footer && (
        <div className="flex items-center gap-2 border-t border-line px-[18px] py-3.5">
          {footer}
        </div>
      )}
    </div>
  );
}
