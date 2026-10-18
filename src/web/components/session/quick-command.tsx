import { Play } from 'lucide-react';
import PillButton from '@/components/ui/pill-button';

interface QuickCommandProps {
  label: string;
  onClick?: () => void;
}

function QuickCommand({ label, onClick }: QuickCommandProps): React.JSX.Element {
  return (
    <PillButton
      onClick={onClick}
      className="h-6 gap-1 bg-hover px-2 font-mono text-3xs text-ink-2 hover:text-ink"
    >
      <Play size={9} className="fill-current text-green" />
      {label}
    </PillButton>
  );
}

export default QuickCommand;
