import { ClaudeTile } from "@/components/atoms/agent-tile";
import { CardButton } from "@/components/task/block-cards";

export function PermissionCard({
  title,
  subject,
  alwaysLabel = "Always allow",
  canRemember = true,
  answering = false,
  onAllow,
  onAlwaysAllow,
  onDeny,
}: {
  title: string;
  subject: string;
  alwaysLabel?: string;
  canRemember?: boolean;
  answering?: boolean;
  onAllow?: () => void;
  onAlwaysAllow?: () => void;
  onDeny?: () => void;
}) {
  return (
    <div className="flex flex-col gap-2.5 rounded-menu bg-surface-raised px-3.5 py-3 shadow-[0_0_0_1px_var(--ring-waiting)]">
      <span className="flex items-center gap-2 text-xs font-medium text-orange">
        <ClaudeTile size={18} />
        {title}
      </span>
      <div className="truncate rounded-control bg-inset px-3 py-[7px] font-mono text-xs text-ink select-text">
        {subject}
      </div>
      <div className="flex items-center gap-1.5">
        <CardButton kind="primary" disabled={answering} onClick={onAllow}>
          Allow once
        </CardButton>
        {canRemember && (
          <CardButton disabled={answering} onClick={onAlwaysAllow}>
            {alwaysLabel}
          </CardButton>
        )}
        <CardButton kind="danger" disabled={answering} onClick={onDeny}>
          Deny
        </CardButton>
        <span className="ml-auto text-2xs text-ink-4">esc to deny</span>
      </div>
    </div>
  );
}
