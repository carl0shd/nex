import { Monitor, Moon, Sun } from 'lucide-react';
import OptionCard from '@/components/ui/option-card';
import type { ThemePreference } from '@/lib/theme';

interface ThemePickerProps {
  value: ThemePreference;
  onChange: (theme: ThemePreference) => void;
}

const THEMES = [
  { value: 'dark' as const, icon: Moon, title: 'Dark' },
  { value: 'light' as const, icon: Sun, title: 'Light' },
  { value: 'system' as const, icon: Monitor, title: 'System' }
];

function ThemePicker({ value, onChange }: ThemePickerProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-3 gap-2">
      {THEMES.map((theme) => (
        <OptionCard
          key={theme.value}
          selected={value === theme.value}
          onClick={() => onChange(theme.value)}
          icon={<theme.icon size={16} className="text-text-secondary" />}
          title={theme.title}
          className="bg-bg-soft"
        />
      ))}
    </div>
  );
}

export default ThemePicker;
