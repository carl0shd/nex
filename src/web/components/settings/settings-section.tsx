interface SettingsSectionProps {
  children: React.ReactNode;
}

function SettingsSection({ children }: SettingsSectionProps): React.JSX.Element {
  return <div className="flex flex-col gap-5">{children}</div>;
}

export default SettingsSection;
