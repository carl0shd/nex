import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Monitor, Moon, Sun } from 'lucide-react';
import CompositesShowcase from '@/components/design-system/composites-showcase';
import DataShowcase from '@/components/design-system/data-showcase';
import FoundationsShowcase from '@/components/design-system/foundations-showcase';
import PrimitivesShowcase from '@/components/design-system/primitives-showcase';
import SettingsHeader from '@/components/settings/settings-header';
import SettingsNav, { type SettingsNavOption } from '@/components/settings/settings-nav';
import SettingsPanel from '@/components/settings/settings-panel';
import SegmentedControl, { type SegmentedControlOption } from '@/components/ui/segmented-control';
import { Separator } from '@/components/ui/separator';
import type { ThemePreference } from '@/lib/theme';
import { useSettingsStore } from '@/stores/settings.store';

type DesignSystemTab = 'foundations' | 'primitives' | 'composites' | 'data';

const NAV_OPTIONS: SettingsNavOption<DesignSystemTab>[] = [
  { value: 'foundations', label: 'Foundations' },
  { value: 'primitives', label: 'Primitives' },
  { value: 'composites', label: 'Composites' },
  { value: 'data', label: 'Data & metrics' }
];

const THEME_OPTIONS: SegmentedControlOption<ThemePreference>[] = [
  { value: 'dark', icon: Moon, title: 'Dark' },
  { value: 'light', icon: Sun, title: 'Light' },
  { value: 'system', icon: Monitor, title: 'System' }
];

function DesignSystem(): React.JSX.Element {
  const navigate = useNavigate();
  const [tab, setTab] = useState<DesignSystemTab>('foundations');
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  return (
    <div className="flex min-w-0 flex-1 animate-fade-in flex-col overflow-hidden">
      <div className="mx-auto w-full max-w-300 shrink-0 px-10 pt-8">
        <div className="flex items-start justify-between gap-6">
          <SettingsHeader
            title="Design system"
            description="Every token and ui/ component, rendered live with the active theme."
            onBack={() => navigate('/')}
          />
          <SegmentedControl value={theme} options={THEME_OPTIONS} onChange={setTheme} />
        </div>

        <Separator className="mt-6" />
      </div>

      <div className="mx-auto flex min-h-0 w-full max-w-300 flex-1 gap-12 px-10 pt-6 pb-8">
        <SettingsNav value={tab} options={NAV_OPTIONS} onChange={setTab} />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <SettingsPanel key={tab}>
            {tab === 'foundations' && <FoundationsShowcase />}
            {tab === 'primitives' && <PrimitivesShowcase />}
            {tab === 'composites' && <CompositesShowcase />}
            {tab === 'data' && <DataShowcase />}
          </SettingsPanel>
        </div>
      </div>
    </div>
  );
}

export default DesignSystem;
