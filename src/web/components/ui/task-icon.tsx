import { GitBranch } from 'lucide-react';

interface TaskIconProps {
  active?: boolean;
  statusColor?: string;
  onClick?: () => void;
}

function TaskIcon({ active = false, statusColor, onClick }: TaskIconProps): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      className={`relative flex size-8 cursor-pointer items-center justify-center rounded-md select-none transition-colors hover:bg-bg-mute ${active ? 'bg-bg-mute' : ''}`}
    >
      <GitBranch size={16} className={active ? 'text-text' : 'text-text-muted'} />
      {statusColor && (
        <span
          className="absolute top-0 right-0 size-2 rounded-full"
          style={{ backgroundColor: statusColor }}
        />
      )}
    </button>
  );
}

export default TaskIcon;
