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
        <h1 className="text-[20px] font-semibold tracking-tight text-text">{title}</h1>
        <p className="text-[13px] text-text-muted">{description}</p>
      </div>
    </div>
  );
}

export default SettingsHeader;
