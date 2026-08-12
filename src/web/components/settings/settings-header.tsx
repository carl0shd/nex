interface SettingsHeaderProps {
  title: string;
  description: string;
}

function SettingsHeader({ title, description }: SettingsHeaderProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-1 select-none">
      <h1 className="text-[20px] font-semibold tracking-tight text-text">{title}</h1>
      <p className="text-[13px] text-text-muted">{description}</p>
    </div>
  );
}

export default SettingsHeader;
