import { Separator as PanelSeparator } from 'react-resizable-panels';
import { cn } from '@/lib/utils';

interface ResizeHandleProps {
  direction: 'horizontal' | 'vertical';
}

function ResizeHandle({ direction }: ResizeHandleProps): React.JSX.Element {
  const isHorizontal = direction === 'horizontal';

  return (
    <PanelSeparator
      className={cn(
        'group relative bg-border-soft hover:bg-accent',
        isHorizontal ? 'w-px cursor-col-resize' : 'h-px cursor-row-resize'
      )}
    >
      <div
        className={
          isHorizontal ? 'absolute top-0 -left-1 h-full w-2' : 'absolute -top-1 left-0 h-2 w-full'
        }
      />
    </PanelSeparator>
  );
}

export default ResizeHandle;
