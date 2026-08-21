import LicensesList from '@/components/settings/licenses-list';
import SettingsSection from '@/components/settings/settings-section';
import BackHeader from '@/components/ui/back-header';
import { Card } from '@/components/ui/card';

interface LicensesViewProps {
  onBack: () => void;
}

function LicensesView({ onBack }: LicensesViewProps): React.JSX.Element {
  return (
    <SettingsSection>
      <BackHeader title="Open source licenses" onBack={onBack} />

      <Card className="gap-0 overflow-hidden bg-bg-soft p-0">
        <LicensesList />
      </Card>
    </SettingsSection>
  );
}

export default LicensesView;
