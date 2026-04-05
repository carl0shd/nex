const DEFAULT_COLORS = [
  '#175F52',
  '#1e40af',
  '#6b21a8',
  '#c2410c',
  '#991b1b',
  '#a16207',
  '#3f3f46'
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  colors?: string[];
  label?: string;
  disabled?: boolean;
}

function ColorPicker({
  value,
  onChange,
  colors = DEFAULT_COLORS,
  label,
  disabled = false
}: ColorPickerProps): React.JSX.Element {
  return (
    <div className={`flex flex-col gap-2 ${disabled ? 'pointer-events-none opacity-30' : ''}`}>
      {label && <label className="text-[10px] font-medium text-text-muted">{label}</label>}
      <div className="flex gap-2.5">
        {colors.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            disabled={disabled}
            className={`h-6 w-6 cursor-pointer rounded-full ${!disabled && value === c ? 'ring-2' : ''}`}
            style={{
              backgroundColor: c,
              ...(!disabled && value === c
                ? ({
                    '--tw-ring-color': `color-mix(in srgb, ${c}, white 30%)`
                  } as React.CSSProperties)
                : {})
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default ColorPicker;
