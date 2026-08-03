import type { LucideIcon } from 'lucide-react';
import { Field, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';

interface TextFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  icon?: LucideIcon;
  trailing?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

function TextField({
  value,
  onChange,
  placeholder,
  label,
  icon: Icon,
  trailing,
  disabled = false,
  className
}: TextFieldProps): React.JSX.Element {
  return (
    <Field className={className}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <InputGroup>
        {Icon && (
          <InputGroupAddon>
            <Icon size={14} />
          </InputGroupAddon>
        )}
        <InputGroupInput
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
        />
        {trailing && <InputGroupAddon align="inline-end">{trailing}</InputGroupAddon>}
      </InputGroup>
    </Field>
  );
}

export { TextField };
