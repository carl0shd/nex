interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function Toggle({ checked, onChange, disabled = false }: ToggleProps): React.JSX.Element {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors ${
        disabled ? 'cursor-default opacity-40' : 'cursor-pointer'
      } ${checked ? 'bg-badge-success-text' : 'bg-border'}`}
    >
      <span
        className={`inline-block h-3 w-3 rounded-full bg-text shadow-sm transition-transform ${
          checked ? 'translate-x-3.5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export default Toggle;
