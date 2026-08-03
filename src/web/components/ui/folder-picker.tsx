import { FolderOpen } from 'lucide-react';
import Chip from '@/components/ui/chip';
import { Field, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon } from '@/components/ui/input-group';
import { cn } from '@/lib/utils';

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
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <InputGroup asChild>
        <button type="button" onClick={onBrowse} className="cursor-pointer hover:border-border">
          <InputGroupAddon>
            <FolderOpen size={14} />
          </InputGroupAddon>
          <span
            className={cn(
              'flex-1 truncate text-left text-[12px]',
              value ? 'text-text-secondary' : 'text-text-placeholder'
            )}
          >
            {value || placeholder}
          </span>
          <InputGroupAddon align="inline-end">
            <Chip className="px-2 text-[10px]">browse</Chip>
          </InputGroupAddon>
        </button>
      </InputGroup>
    </Field>
  );
}

export default FolderPicker;
