import { Play } from 'lucide-react';

interface QuickCommandProps {
  label: string;
  onClick?: () => void;
}

function QuickCommand({ label, onClick }: QuickCommandProps): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      className="flex cursor-pointer items-center gap-1 rounded border border-border-soft px-2 py-0.75 font-mono text-[10px] font-medium text-text-secondary select-none hover:border-border hover:bg-bg-hover hover:text-text"
    >
      <Play size={10} className="text-badge-success-text" />
      {label}
    </button>
  );
}

export default QuickCommand;
