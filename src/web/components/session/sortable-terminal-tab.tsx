import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { SessionTab } from '@/lib/session-view';
import TerminalTab from '@/components/session/terminal-tab';
import { cn } from '@/lib/utils';

interface SortableTerminalTabProps {
  tab: SessionTab;
  onClick?: () => void;
  onClose?: () => void;
}

function SortableTerminalTab({
  tab,
  onClick,
  onClose
}: SortableTerminalTabProps): React.JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tab.id
  });

  // Translate, not Transform: the sortable strategy also scales each item to the
  // width of the one it swaps with, which squashes tabs of different lengths.
  const style = { transform: CSS.Translate.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('shrink-0', isDragging && 'opacity-0')}
      {...attributes}
      {...listeners}
    >
      <TerminalTab
        name={tab.name}
        status={tab.status}
        active={tab.active}
        onClick={onClick}
        onClose={onClose}
      />
    </div>
  );
}

export default SortableTerminalTab;
