import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';

interface SettingFieldProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

function SettingField({ label, description, children }: SettingFieldProps): React.JSX.Element {
  return (
    <Field className="gap-2">
      <FieldLabel className="text-xs text-ink">{label}</FieldLabel>
      {children}
      {description && <FieldDescription className="text-2xs">{description}</FieldDescription>}
    </Field>
  );
}

export default SettingField;
