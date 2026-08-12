import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';

interface SettingFieldProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

/** Label over a full-width control, with the help text underneath — the shadcn form field shape. */
function SettingField({ label, description, children }: SettingFieldProps): React.JSX.Element {
  return (
    <Field className="gap-2">
      <FieldLabel className="text-[12px] text-text">{label}</FieldLabel>
      {children}
      {description && <FieldDescription className="text-[11px]">{description}</FieldDescription>}
    </Field>
  );
}

export default SettingField;
