interface CountBadgeProps {
  count: number;
}

function CountBadge({ count }: CountBadgeProps): React.JSX.Element {
  return (
    <span className="flex h-4 min-w-6.25 items-center justify-center rounded-full bg-badge-count-bg px-1.5 text-[10px] font-semibold text-badge-count-text">
      {count}
    </span>
  );
}

export default CountBadge;
