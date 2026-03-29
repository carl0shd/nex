interface ProjectItemProps {
  name: string;
  color: string;
  active?: boolean;
  onClick?: () => void;
}

function ProjectItem({
  name,
  color,
  active = false,
  onClick
}: ProjectItemProps): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-left select-none transition-colors ${
        active
          ? 'bg-bg-mute text-text'
          : 'text-text-secondary hover:bg-bg-mute/50 hover:text-text-secondary'
      }`}
    >
      <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <span className="truncate text-[13px]">{name}</span>
    </button>
  );
}

export default ProjectItem;
