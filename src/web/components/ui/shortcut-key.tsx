interface ShortcutKeyProps {
  keys: string;
  label: string;
}

function ShortcutKey({ keys, label }: ShortcutKeyProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <kbd className="flex items-center justify-center select-none rounded border border-border bg-border-soft px-1 py-[0.2px] text-center font-[system-ui] text-[10px] tracking-wider text-text">
        {keys}
      </kbd>
      <span className="text-[11px] text-text-muted">{label}</span>
    </div>
  );
}

export default ShortcutKey;
