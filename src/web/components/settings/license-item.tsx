import { ChevronDown, ChevronRight } from 'lucide-react';
import SimpleBar from 'simplebar-react';
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
        className="flex items-center gap-2 px-3 py-2 text-left select-none enabled:cursor-pointer enabled:hover:bg-hover-2"
      >
        <Chevron size={12} className={text ? 'shrink-0 text-ink-3' : 'shrink-0 opacity-0'} />
        <span className="truncate text-xs text-ink">{name}</span>
        <span className="shrink-0 font-mono text-2xs text-ink-3">{version}</span>
        <span className="flex-1" />
        <Chip>{license}</Chip>
      </button>

      {expanded && text && (
        <SimpleBar
          style={{ maxHeight: '15rem' }}
          autoHide={false}
          className="mx-3 mb-2.5 rounded border border-line-soft bg-inset"
        >
          <pre className="p-2.5 pr-4 font-mono text-3xs leading-relaxed whitespace-pre-wrap text-ink-3 select-text">
            {text}
          </pre>
        </SimpleBar>
      )}
    </div>
  );
}

export default LicenseItem;
