interface TextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  rows?: number;
  disabled?: boolean;
}

function Textarea({
  value,
  onChange,
  placeholder,
  label,
  rows = 3,
  disabled = false
}: TextareaProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-[10px] font-medium text-text-muted">{label}</label>}
      <div
        className={`flex rounded-[5px] border border-border-soft bg-bg-input px-2.5 py-2 not-focus-within:hover:border-border focus-within:border-border ${disabled ? 'opacity-50' : ''}`}
      >
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className="w-full resize-none bg-transparent text-[11px] leading-relaxed text-text-secondary placeholder:text-text-placeholder outline-none focus:text-text"
        />
      </div>
    </div>
  );
}

export default Textarea;
