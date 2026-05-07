interface ActiveBadgeProps {
  count: number;
}

function ActiveBadge({ count }: ActiveBadgeProps): React.JSX.Element {
  const idle = count === 0;
  return (
    <span
      className={`inline-flex select-none items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${
        idle ? 'bg-bg-mute text-text-muted' : 'bg-accent/40 text-badge-success-text'
      }`}
    >
      <span
        className={`size-1.5 rounded-full ${idle ? 'bg-text-muted' : 'bg-badge-success-text'}`}
      />
      {count} active
    </span>
  );
}

export default ActiveBadge;
