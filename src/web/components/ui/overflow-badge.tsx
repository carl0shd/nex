interface OverflowBadgeProps {
  count: number;
  onClick?: () => void;
}

function OverflowBadge({ count, onClick }: OverflowBadgeProps): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      className="cursor-pointer rounded border border-border px-2 py-0.75 font-mono text-[10px] font-medium text-text-secondary select-none hover:border-border-hover hover:bg-bg-hover hover:text-text"
    >
      +{count}
    </button>
  );
}

export default OverflowBadge;
