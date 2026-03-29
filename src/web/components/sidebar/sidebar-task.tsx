import { GitBranch } from 'lucide-react';

type SidebarTaskStatus = 'active' | 'running';

interface SidebarTaskProps {
  name: string;
  status?: SidebarTaskStatus;
  active?: boolean;
  onClick?: () => void;
}

const statusStyles: Record<SidebarTaskStatus, { bg: string; text: string }> = {
  active: { bg: 'bg-accent/12', text: 'text-badge-success-text' },
  running: { bg: 'bg-bg-mute', text: 'text-badge-warning-text' }
};

function SidebarTask({
  name,
  status,
  active = false,
  onClick
}: SidebarTaskProps): React.JSX.Element {
  const style = status ? statusStyles[status] : null;

  return (
    <button
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded px-2 py-1 pl-4.5 text-left select-none ${
        active ? 'bg-bg-mute/50' : 'hover:bg-bg-mute/50'
      }`}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <GitBranch size={12} className="shrink-0 text-text-muted" />
        <span className={`truncate text-[12px] ${active ? 'text-text' : 'text-text-muted'}`}>
          {name}
        </span>
      </div>
      {style && (
        <span
          className={`shrink-0 rounded-xl px-1.5 py-px text-[10px] font-semibold ${style.bg} ${style.text}`}
        >
          {status}
        </span>
      )}
    </button>
  );
}

export default SidebarTask;
