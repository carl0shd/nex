import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SettingsGroupHeader({
  label,
  trailing,
}: {
  label?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex min-h-[26px] items-center gap-2 px-0.5 text-xs font-medium text-ink-3">
      {label}
      {trailing && <span className="ml-auto flex items-center gap-1">{trailing}</span>}
    </div>
  );
}

export function SettingsCard({
  label,
  trailing,
  children,
  className,
}: {
  label?: ReactNode;
  trailing?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {(label || trailing) && <SettingsGroupHeader label={label} trailing={trailing} />}
      <div className="overflow-hidden rounded-panel bg-surface shadow-card [&>*+*]:border-t [&>*+*]:border-line">
        {children}
      </div>
    </div>
  );
}

export function SettingRow({
  label,
  description,
  control,
}: {
  label: string;
  description?: string;
  control: ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5">
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium text-ink">{label}</span>
        {description && <span className="text-xs leading-[17px] text-ink-3">{description}</span>}
      </span>
      <span className="flex shrink-0 items-center gap-1.5">{control}</span>
    </div>
  );
}
