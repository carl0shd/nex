import { ArrowLeft } from 'lucide-react';
import IconButton from '@/components/ui/icon-button';

interface SettingsHeaderProps {
  title: string;
  description: string;
  onBack?: () => void;
}

function SettingsHeader({ title, description, onBack }: SettingsHeaderProps): React.JSX.Element {
  return (
    <div className="flex items-start gap-2 select-none">
      {onBack && (
        <IconButton
          icon={ArrowLeft}
          size={18}
          variant="ghost"
          onClick={onBack}
          aria-label="Back"
          className="mt-0.5 -ml-1.5"
        />
      )}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
        <p className="text-sm text-ink-3">{description}</p>
      </div>
    </div>
  );
}

export default SettingsHeader;
