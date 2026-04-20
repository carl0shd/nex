import { Zap } from 'lucide-react';

interface TokensBadgeProps {
  percent: number;
}

function TokensBadge({ percent }: TokensBadgeProps): React.JSX.Element {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <span className="inline-flex select-none items-center gap-2 rounded-full bg-accent/40 px-2.5 py-0.5 text-[11px] font-medium">
      <Zap size={11} className="shrink-0 text-badge-warning-text/70" strokeWidth={2} />
      <span className="h-1 w-14 overflow-hidden rounded-full bg-badge-warning-text/10">
        <span
          className="block h-full rounded-full bg-badge-warning-text/70"
          style={{ width: `${clamped}%` }}
        />
      </span>
      <span className="text-badge-warning-text/50">{Math.round(clamped)}%</span>
    </span>
  );
}

export default TokensBadge;
