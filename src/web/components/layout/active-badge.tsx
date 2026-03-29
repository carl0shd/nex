interface ActiveBadgeProps {
  count: number;
}

function ActiveBadge({ count }: ActiveBadgeProps): React.JSX.Element {
  return (
    <div className="flex max-h-5.25 select-none items-center gap-1.5 rounded-xl bg-accent/12 px-2 py-1">
      <span className="size-1.5 rounded-full bg-badge-success-text" />
      <span className="text-[11px] font-medium text-badge-success-text">{count} active</span>
    </div>
  );
}

export default ActiveBadge;
