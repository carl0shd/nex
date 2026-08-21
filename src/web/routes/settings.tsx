import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SimpleBar from 'simplebar-react';
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
    <div className="min-w-0 flex-1 overflow-hidden bg-bg">
      <SimpleBar style={{ maxHeight: '100%' }} autoHide={false}>
        <div className="mx-auto flex w-full max-w-300 flex-col px-10 py-8">
          <SettingsHeader
            title="Settings"
            description="Manage how Nex looks and behaves. Preferences apply to every project."
            onBack={() => navigate('/')}
          />

          <Separator className="my-6" />

          <div className="flex gap-12">
            <SettingsNav value={tab} options={NAV_OPTIONS} onChange={setTab} />

            <div className="min-w-0 max-w-225 flex-1 pb-10">
              {tab === 'appearance' && <AppearancePanel />}
              {tab === 'diff' && <DiffPanel />}
              {tab === 'about' && <AboutPanel />}
            </div>
          </div>
        </div>
      </SimpleBar>
    </div>
  );
}

export default Settings;
