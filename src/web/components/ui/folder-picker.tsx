import { FolderOpen } from 'lucide-react';

interface FolderPickerProps {
  value: string;
  onBrowse: () => void;
  label?: string;
  placeholder?: string;
}

function FolderPicker({
  value,
  onBrowse,
  label = '// project path',
  placeholder = 'select project folder...'
}: FolderPickerProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-medium text-text-muted">{label}</label>
      <button
        onClick={onBrowse}
        className="flex cursor-pointer items-center gap-2 rounded-[5px] border border-border-soft bg-bg-input px-2.5 py-2 hover:border-border"
      >
        <FolderOpen size={14} className="shrink-0 text-text-muted" />
        <span
          className={`flex-1 truncate text-left text-[12px] ${value ? 'text-text-secondary' : 'text-text-placeholder'}`}
        >
          {value || placeholder}
        </span>
        <span className="rounded-[3px] bg-bg-raised px-2 py-0.5 text-[10px] font-medium text-text-muted">
          browse
        </span>
      </button>
    </div>
  );
}

export default FolderPicker;
