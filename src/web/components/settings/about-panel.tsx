import { useEffect, useState } from 'react';
import nexLogo from '@/assets/images/logo.svg';
import SettingsPanel from '@/components/settings/settings-panel';
import LicensesView from '@/components/settings/licenses-view';
import SettingRow, { SettingValue } from '@/components/ui/setting-row';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface AppInfo {
  platform: string;
  version: string;
  versions: { electron: string; chrome: string; node: string };
}

const PLATFORM_NAMES: Record<string, string> = {
  darwin: 'macOS',
  win32: 'Windows',
  linux: 'Linux'
};

function AboutPanel(): React.JSX.Element {
  const [info, setInfo] = useState<AppInfo | null>(null);
  const [viewingLicenses, setViewingLicenses] = useState(false);

  useEffect(() => {
    let active = true;
    window.api.getAppInfo().then((value) => {
      if (active) setInfo(value);
    });
    return (): void => {
      active = false;
    };
  }, []);

  if (viewingLicenses) return <LicensesView onBack={() => setViewingLicenses(false)} />;

  return (
    <SettingsPanel>
      <div className="flex items-center gap-3">
        <img src={nexLogo} alt="Nex" className="size-8" draggable={false} />
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-medium text-text">Nex {info?.version ?? ''}</span>
          <span className="text-[11px] text-text-muted">
            Git worktrees, terminals and diffs in one place.
          </span>
        </div>
      </div>

      <Card className="gap-0 divide-y divide-border-soft overflow-hidden bg-bg-soft p-0">
        <SettingRow
          variant="plain"
          title="Version"
          control={<SettingValue>{info?.version ?? '—'}</SettingValue>}
        />
        <SettingRow
          variant="plain"
          title="Platform"
          control={
            <SettingValue>
              {info ? (PLATFORM_NAMES[info.platform] ?? info.platform) : '—'}
            </SettingValue>
          }
        />
        <SettingRow
          variant="plain"
          title="Electron"
          control={<SettingValue>{info?.versions.electron ?? '—'}</SettingValue>}
        />
        <SettingRow
          variant="plain"
          title="Chromium"
          control={<SettingValue>{info?.versions.chrome ?? '—'}</SettingValue>}
        />
        <SettingRow
          variant="plain"
          title="Node"
          control={<SettingValue>{info?.versions.node ?? '—'}</SettingValue>}
        />
        <SettingRow
          variant="plain"
          title="Open source licenses"
          className="py-1.5"
          control={
            <Button variant="outline" size="sm" onClick={() => setViewingLicenses(true)}>
              View
            </Button>
          }
        />
      </Card>
    </SettingsPanel>
  );
}

export default AboutPanel;
