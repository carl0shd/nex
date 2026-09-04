import WorkspaceBadge from '@/components/ui/workspace-badge';

interface SessionWorkspaceGroupProps {
  name: string;
  color: string;
  icon?: string;
  customImage?: string | null;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}

function SessionWorkspaceGroup({
  name,
  color,
  icon,
  customImage,
  trailing,
  children
}: SessionWorkspaceGroupProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-0.5">
      <header className="flex items-center gap-1.5 px-1.5 py-0.5">
        <WorkspaceBadge
          name={name}
          color={color}
          icon={icon}
          customImage={customImage}
          size={12}
          fontSize={6}
          rounded="rounded-xs"
        />
        <span className="truncate text-[11px] text-text-secondary">{name}</span>
        <span className="flex-1" />
        {trailing}
      </header>
      {children}
    </div>
  );
}

export default SessionWorkspaceGroup;
