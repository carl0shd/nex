interface SettingsSectionProps {
  children: React.ReactNode;
}

/** Vertical rhythm shared by every settings panel. The nav already names the section. */
function SettingsSection({ children }: SettingsSectionProps): React.JSX.Element {
  return <div className="flex flex-col gap-5">{children}</div>;
}

export default SettingsSection;
