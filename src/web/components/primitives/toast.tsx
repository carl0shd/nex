import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Kbd } from "@/components/atoms/kbd";
import { Spinner } from "@/components/atoms/spinner";
import { StatusDot, type DotTone } from "@/components/atoms/status-dot";
import { cn } from "@/lib/utils";

export type ToastTone = "green" | "orange" | "red" | "blue" | "neutral";

export interface ToastAction {
  label: string;
  kind: "green" | "neutral" | "ghost" | "danger";
  kbd?: string;
  onClick?: () => void;
}

export interface ToastTip {
  keys: string;
  label: string;
}

export interface ToastProps {
  tone: ToastTone;
  status: string;
  working?: boolean;
  meta?: string;
  time?: string;
  title: string;
  body?: ReactNode;
  code?: string;
  tips?: readonly ToastTip[];
  progress?: number;
  actions?: readonly ToastAction[];
  countdown?: number;
  paused?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export interface CompactToastProps {
  tone: ToastTone;
  title: string;
  action?: string;
  onAction?: () => void;
  className?: string;
}

const DOT: Record<ToastTone, DotTone> = {
  green: "green",
  orange: "orange",
  red: "red",
  blue: "blue",
  neutral: "idle",
};

const STATUS_TEXT: Record<ToastTone, string> = {
  green: "text-green",
  orange: "text-orange",
  red: "text-red",
  blue: "text-blue",
  neutral: "text-ink-3",
};

const ACTION: Record<ToastAction["kind"], string> = {
  green: "bg-accent text-on-accent hover:bg-accent-hover",
  neutral: "bg-ink text-inverse hover:opacity-90",
  ghost: "text-ink-2 shadow-btn hover:bg-hover hover:text-ink",
  danger: "text-red hover:bg-red-tint",
};

function ToastButton({ action }: { action: ToastAction }) {
  return (
    <button
      type="button"
      onClick={action.onClick}
      className={cn(
        "interactive press flex h-7 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs font-medium select-none",
        ACTION[action.kind],
      )}
    >
      {action.label}
      {action.kbd && <span className="text-3xs opacity-60">{action.kbd}</span>}
    </button>
  );
}

function DismissButton({ onClick, className }: { onClick?: () => void; className?: string }) {
  return (
    <button
      type="button"
      aria-label="Dismiss"
      onClick={onClick}
      className={cn(
        "interactive press flex size-5 cursor-pointer items-center justify-center rounded-full text-ink-4 select-none hover:bg-hover hover:text-ink-2",
        className,
      )}
    >
      <X width={11} height={11} strokeWidth={2.25} />
    </button>
  );
}

export function Toast({
  tone,
  status,
  working = false,
  meta,
  time,
  title,
  body,
  code,
  tips,
  progress,
  actions = [],
  countdown,
  paused = false,
  onDismiss,
  className,
}: ToastProps) {
  return (
    <div
      role="status"
      className={cn(
        "group enter-toast relative flex w-[340px] flex-col overflow-hidden rounded-panel bg-glass p-3.5 shadow-toast backdrop-blur-[28px] backdrop-saturate-[1.1]",
        className,
      )}
    >
      <div className="flex h-[18px] items-center gap-1.5 pr-6 text-2xs">
        {working ? <Spinner className="size-2.5" /> : <StatusDot tone={DOT[tone]} />}
        <span className={cn("shrink-0 font-medium whitespace-nowrap", STATUS_TEXT[tone])}>
          {status}
        </span>
        {meta && <span className="truncate text-ink-4">· {meta}</span>}
      </div>
      {time && (
        <span className="absolute top-3.5 right-3.5 text-2xs leading-[18px] text-ink-5 transition-opacity duration-150 ease-out-strong group-hover:opacity-0">
          {time}
        </span>
      )}
      <span className="absolute top-3 right-3 flex opacity-0 transition-opacity duration-150 ease-out-strong group-hover:opacity-100 focus-within:opacity-100">
        <DismissButton onClick={onDismiss} />
      </span>

      <span className="mt-1 text-sm leading-[18px] font-semibold text-ink">{title}</span>
      {body && <span className="mt-1.5 text-xs leading-[18px] text-ink-3">{body}</span>}
      {code && (
        <span className="mt-2 truncate rounded-control bg-inset px-2.5 py-[7px] font-mono text-2xs leading-[17px] text-ink shadow-[inset_0_0_0_1px_var(--line-soft)]">
          {code}
        </span>
      )}
      {tips && (
        <ul className="mt-2 flex flex-col gap-2">
          {tips.map((tip) => (
            <li key={tip.keys} className="flex items-center gap-2.5 text-xs text-ink-2">
              <span className="min-w-[52px]">
                <Kbd>{tip.keys}</Kbd>
              </span>
              {tip.label}
            </li>
          ))}
        </ul>
      )}
      {progress !== undefined && (
        <span className="mt-2.5 block h-1 overflow-hidden rounded-full bg-hover">
          <span
            className="block h-full rounded-full bg-ink-2 transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </span>
      )}
      {actions.length > 0 && (
        <div className="mt-3 flex items-center gap-1.5">
          {actions.map((action) => (
            <ToastButton key={action.label} action={action} />
          ))}
        </div>
      )}
      {countdown !== undefined && (
        <span
          aria-hidden
          className="countdown absolute inset-x-0 bottom-0 h-0.5 bg-ink/25"
          style={{
            animationDuration: `${countdown}ms`,
            animationPlayState: paused ? "paused" : undefined,
          }}
        />
      )}
    </div>
  );
}

export function CompactToast({ tone, title, action, onAction, className }: CompactToastProps) {
  return (
    <div
      role="status"
      className={cn(
        "enter-toast inline-flex h-9 max-w-[340px] items-center gap-2 rounded-full bg-glass pr-1.5 pl-3 text-sm whitespace-nowrap text-ink shadow-toast backdrop-blur-[28px] backdrop-saturate-[1.1]",
        className,
      )}
    >
      <StatusDot tone={DOT[tone]} />
      <span className="min-w-0 truncate" title={title}>
        {title}
      </span>
      {action ? (
        <button
          type="button"
          onClick={onAction}
          className="interactive press h-6 shrink-0 cursor-pointer rounded-full px-2.5 text-xs font-medium text-ink-2 shadow-btn select-none hover:bg-hover hover:text-ink"
        >
          {action}
        </button>
      ) : (
        <span className="w-1.5" />
      )}
    </div>
  );
}
