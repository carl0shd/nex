import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UsagePopoverFooterProps {
  onNavigate?: () => void;
}

function UsagePopoverFooter({ onNavigate }: UsagePopoverFooterProps): React.JSX.Element {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => {
        onNavigate?.();
        navigate('/settings', { state: { tab: 'usage' } });
      }}
      className="flex cursor-pointer items-center justify-between rounded-md px-1 py-1 text-[11px] text-text-secondary select-none hover:bg-bg-hover hover:text-text"
    >
      View all usage
      <ArrowRight size={12} strokeWidth={2} />
    </button>
  );
}

export default UsagePopoverFooter;
