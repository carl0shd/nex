import { memo } from 'react';

interface CountBadgeProps {
  count: number;
}

function CountBadge({ count }: CountBadgeProps): React.JSX.Element {
  return (
    <span className="flex h-[18px] min-w-6 items-center justify-center rounded-full bg-hover-2 px-1.5 text-3xs font-semibold text-ink-3 tabular-nums">
      {count}
    </span>
  );
}

export default memo(CountBadge);
