import { useState } from 'react';
import licenses from '@/assets/licenses.json';
import LicenseItem from '@/components/settings/license-item';

function LicensesList(): React.JSX.Element {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="divide-y divide-border-soft">
      {licenses.map((entry) => (
        <LicenseItem
          key={entry.name}
          name={entry.name}
          version={entry.version}
          license={entry.license}
          text={entry.text}
          expanded={expanded === entry.name}
          onToggle={() => setExpanded(expanded === entry.name ? null : entry.name)}
        />
      ))}
    </div>
  );
}

export default LicensesList;
