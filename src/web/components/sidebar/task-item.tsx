import { GitBranch } from 'lucide-react';
import Badge from '@/components/ui/badge';
import { statusToVariant } from '@/lib/status';
import type { Status } from '@/lib/status';

interface TaskItemProps {
  name: string;
  status?: Status;
  active?: boolean;
  onClick?: () => void;
}

function TaskItem({
  name,
  status = 'idle',
  active = false,
  onClick
}: TaskItemProps): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left select-none ${
        active
          ? 'bg-bg-mute text-text'
          : 'text-text-secondary hover:bg-bg-mute/50 hover:text-text-secondary'
      }`}
    >
      <GitBranch size={13} className="shrink-0 text-text-muted" />
      <span className="flex-1 truncate text-[13px]">{name}</span>
      <Badge label={status} variant={statusToVariant[status]} />
    </button>
  );
}

export default TaskItem;
