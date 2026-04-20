interface ActiveBadgeProps {
  count: number;
}

function ActiveBadge({ count }: ActiveBadgeProps): React.JSX.Element {
  return (
    <span className="inline-flex select-none items-center gap-1.5 rounded-full bg-accent/40 px-2 py-0.5 text-[11px] font-medium text-badge-success-text">
      <span className="size-1.5 rounded-full bg-badge-success-text" />
      {count} active
    </span>
  );
}

export default ActiveBadge;
