import { ArrowDown, ArrowUp, History } from "lucide-react";

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="interactive press flex size-[18px] cursor-pointer items-center justify-center rounded-[5px] bg-elevated text-ink-3 shadow-[inset_0_0_0_1px_var(--line-strong)] select-none hover:text-ink disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export function HistoryHint({
  position,
  total,
  onOlder,
  onNewer,
}: {
  position: number;
  total: number;
  onOlder: () => void;
  onNewer: () => void;
}) {
  return (
    <div className="enter-pop absolute right-2 bottom-full mb-1.5 flex items-center gap-1.5 text-2xs text-ink-4">
      <History width={11} height={11} strokeWidth={2} />
      <span className="tabular-nums">
        From your history · {position} of {total}
      </span>
      <StepButton label="Older prompt" disabled={position >= total} onClick={onOlder}>
        <ArrowUp width={10} height={10} strokeWidth={2.5} />
      </StepButton>
      <StepButton label="Newer prompt" disabled={false} onClick={onNewer}>
        <ArrowDown width={10} height={10} strokeWidth={2.5} />
      </StepButton>
    </div>
  );
}
