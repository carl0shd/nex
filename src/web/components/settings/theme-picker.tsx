import { Moon, Sun } from 'lucide-react';
import OptionCard from '@/components/ui/option-card';
import type { ThemeName } from '@/lib/theme';

interface ThemePickerProps {
  value: ThemeName;
  onChange: (theme: ThemeName) => void;
}

const THEMES = [
  { value: 'dark' as const, icon: Moon, title: 'Dark', subtitle: 'Charcoal surfaces, low glare' },
  { value: 'light' as const, icon: Sun, title: 'Light', subtitle: 'Warm paper surfaces' }
];

function ThemePicker({ value, onChange }: ThemePickerProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-2 gap-2">
      {THEMES.map((theme) => (
        <OptionCard
          key={theme.value}
          selected={value === theme.value}
          onClick={() => onChange(theme.value)}
          icon={<theme.icon size={16} className="text-text-secondary" />}
          title={theme.title}
          subtitle={theme.subtitle}
          className="bg-bg-soft"
        />
      ))}
    </div>
  );
}

export default ThemePicker;
