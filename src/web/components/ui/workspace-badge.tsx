interface WorkspaceBadgeProps {
  initial: string;
  color: string;
  active?: boolean;
  onClick?: () => void;
}

function WorkspaceBadge({
  initial,
  color,
  active = true,
  onClick
}: WorkspaceBadgeProps): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      className={`flex size-8 cursor-pointer items-center justify-center rounded-md text-[13px] font-semibold text-text select-none transition-opacity ${
        active ? 'opacity-100' : 'opacity-40'
      }`}
      style={{ backgroundColor: color }}
    >
      {initial}
    </button>
  );
}

export default WorkspaceBadge;
