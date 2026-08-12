import { ChevronDown, ChevronRight } from 'lucide-react';
import Chip from '@/components/ui/chip';

interface LicenseItemProps {
  name: string;
  version: string;
  license: string;
  text: string;
  expanded: boolean;
  onToggle: () => void;
}

function LicenseItem({
  name,
  version,
  license,
  text,
  expanded,
  onToggle
}: LicenseItemProps): React.JSX.Element {
  const Chevron = expanded ? ChevronDown : ChevronRight;

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={onToggle}
        disabled={!text}
        className="flex items-center gap-2 rounded px-2 py-1.5 text-left select-none enabled:cursor-pointer enabled:hover:bg-bg-hover"
      >
        <Chevron size={12} className={text ? 'shrink-0 text-text-muted' : 'shrink-0 opacity-0'} />
        <span className="truncate text-[12px] text-text">{name}</span>
        <span className="shrink-0 font-mono text-[11px] text-text-muted">{version}</span>
        <span className="flex-1" />
        <Chip>{license}</Chip>
      </button>

      {expanded && text && (
        <pre className="mx-2 mb-1 max-h-60 overflow-auto rounded border border-border-soft bg-bg-input p-2.5 font-mono text-[10px] leading-relaxed whitespace-pre-wrap text-text-muted select-text">
          {text}
        </pre>
      )}
    </div>
  );
}

export default LicenseItem;
