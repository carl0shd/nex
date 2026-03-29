interface ShortcutKeyProps {
  keys: string;
  label: string;
}

function ShortcutKey({ keys, label }: ShortcutKeyProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <kbd className="select-none rounded-sm border border-border bg-bg-soft px-1.5 py-0.5 text-center font-[system-ui] text-[11px] leading-none text-text">
        {keys}
      </kbd>
      <span className="text-[11px] text-text-muted">{label}</span>
    </div>
  );
}

export default ShortcutKey;
