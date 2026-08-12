import SettingsNavItem from '@/components/settings/settings-nav-item';

interface SettingsNavOption<T extends string> {
  value: T;
  label: string;
}

interface SettingsNavProps<T extends string> {
  value: T;
  options: SettingsNavOption<T>[];
  onChange: (value: T) => void;
}

function SettingsNav<T extends string>({
  value,
  options,
  onChange
}: SettingsNavProps<T>): React.JSX.Element {
  return (
    <nav className="flex w-52 shrink-0 flex-col gap-1">
      {options.map((option) => (
        <SettingsNavItem
          key={option.value}
          label={option.label}
          active={option.value === value}
          onClick={() => onChange(option.value)}
        />
      ))}
    </nav>
  );
}

export default SettingsNav;
export type { SettingsNavOption };
