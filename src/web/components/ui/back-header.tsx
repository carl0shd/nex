import { ArrowLeft } from 'lucide-react';
import IconButton from '@/components/ui/icon-button';

interface BackHeaderProps {
  title: string;
  description?: string;
  onBack: () => void;
}

function BackHeader({ title, description, onBack }: BackHeaderProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-1.5 select-none">
      <IconButton icon={ArrowLeft} size={15} variant="ghost" onClick={onBack} aria-label="Back" />
      <div className="flex flex-col gap-0.5">
        <span className="text-[12px] font-medium text-text">{title}</span>
        {description && <span className="text-[11px] text-text-muted">{description}</span>}
      </div>
    </div>
  );
}

export default BackHeader;
