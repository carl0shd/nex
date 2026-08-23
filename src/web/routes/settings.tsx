import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SettingsHeader from '@/components/settings/settings-header';
import SettingsNav, { type SettingsNavOption } from '@/components/settings/settings-nav';
import AppearancePanel from '@/components/settings/appearance-panel';
import DiffPanel from '@/components/settings/diff-panel';
import AboutPanel from '@/components/settings/about-panel';
import { Separator } from '@/components/ui/separator';

type SettingsTab = 'appearance' | 'diff' | 'about';

const NAV_OPTIONS: SettingsNavOption<SettingsTab>[] = [
  { value: 'appearance', label: 'Appearance' },
  { value: 'diff', label: 'Diff viewer' },
  { value: 'about', label: 'About' }
];

function Settings(): React.JSX.Element {
  const [tab, setTab] = useState<SettingsTab>('appearance');
  const navigate = useNavigate();

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-bg">
      <div className="mx-auto w-full max-w-300 shrink-0 px-10 pt-8">
        <SettingsHeader
          title="Settings"
          description="Manage how Nex looks and behaves. Preferences apply to every project."
          onBack={() => navigate('/')}
        />

        <Separator className="mt-6" />
      </div>

      <div className="mx-auto flex min-h-0 w-full max-w-300 flex-1 gap-12 px-10 pt-6 pb-8">
        <SettingsNav value={tab} options={NAV_OPTIONS} onChange={setTab} />

        <div className="flex min-h-0 min-w-0 max-w-225 flex-1 flex-col">
          {tab === 'appearance' && <AppearancePanel />}
          {tab === 'diff' && <DiffPanel />}
          {tab === 'about' && <AboutPanel />}
        </div>
      </div>
    </div>
  );
}

export default Settings;
