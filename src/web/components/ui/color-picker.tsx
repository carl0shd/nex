import { Field, FieldLabel } from '@/components/ui/field';
import { cn } from '@/lib/utils';

const DEFAULT_COLORS = [
  '#33843F',
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
    <Field className={cn('gap-2', disabled && 'pointer-events-none opacity-30')}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <div className="flex gap-2.5">
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            disabled={disabled}
            className={cn(
              'size-6 cursor-pointer rounded-full',
              !disabled && value === c && 'ring-2'
            )}
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
    </Field>
  );
}

export default ColorPicker;
