import { Separator } from 'react-resizable-panels';

interface ResizeHandleProps {
  direction: 'horizontal' | 'vertical';
}

function ResizeHandle({ direction }: ResizeHandleProps): React.JSX.Element {
  const isHorizontal = direction === 'horizontal';
  return (
    <Separator
      className={`group relative bg-border-soft hover:bg-accent ${
        isHorizontal ? 'w-px cursor-col-resize' : 'h-px cursor-row-resize'
      }`}
    >
      <div
        className={
          isHorizontal ? 'absolute -left-1 top-0 h-full w-2' : 'absolute left-0 -top-1 h-2 w-full'
        }
      />
    </Separator>
  );
}

export default ResizeHandle;
