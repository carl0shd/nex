import { ClaudeTile } from "@/components/atoms/agent-tile";

export function PermissionCard({ title, subject }: { title: string; subject: string }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-menu bg-surface-raised px-3.5 py-3 shadow-[0_0_0_1px_var(--ring-waiting)]">
      <span className="flex items-center gap-2 text-xs font-medium text-orange">
        <ClaudeTile size={18} />
        {title}
      </span>
      <div className="rounded-control bg-inset px-3 py-[7px] font-mono text-xs text-ink">
        {subject}
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="interactive press h-7 cursor-pointer rounded-full bg-accent px-3 text-xs font-medium text-on-accent select-none hover:bg-accent-hover"
        >
          Allow once
        </button>
        <button
          type="button"
          className="interactive press h-7 cursor-pointer rounded-full bg-elevated px-3 text-xs font-medium text-ink shadow-[0_0_0_1px_rgb(255_255_255/6%)] select-none hover:bg-control-off"
        >
          Always allow
        </button>
        <button
          type="button"
          className="interactive press h-7 cursor-pointer rounded-full px-3 text-xs font-medium text-red select-none hover:bg-red-tint"
        >
          Deny
        </button>
      </div>
    </div>
  );
}
