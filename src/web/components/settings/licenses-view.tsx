import LicensesList from '@/components/settings/licenses-list';
import SettingsPanel from '@/components/settings/settings-panel';
import BackHeader from '@/components/ui/back-header';
import { Card } from '@/components/ui/card';

interface LicensesViewProps {
  onBack: () => void;
}

function LicensesView({ onBack }: LicensesViewProps): React.JSX.Element {
  return (
    <SettingsPanel header={<BackHeader title="Open source licenses" onBack={onBack} />}>
      <Card className="gap-0 overflow-hidden bg-bg-soft p-0">
        <LicensesList />
      </Card>
    </SettingsPanel>
  );
}

export default LicensesView;
