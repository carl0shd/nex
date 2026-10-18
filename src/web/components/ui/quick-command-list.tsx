import { Plus, X, Play } from 'lucide-react';
import SimpleBar from 'simplebar-react';
import type { QuickCommand } from '@native/db/types';
import { Button } from '@/components/ui/button';
import { FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Separator } from '@/components/ui/separator';

const MONO_FONT = 'JetBrains Mono Variable, JetBrains Mono, monospace';

interface QuickCommandRowProps {
  cmd: QuickCommand;
  onChange: (field: 'name' | 'command', value: string) => void;
  onRemove: () => void;
}

function QuickCommandRow({ cmd, onChange, onRemove }: QuickCommandRowProps): React.JSX.Element {
  return (
    <InputGroup className="h-7 bg-transparent">
      <InputGroupAddon>
        <Play size={10} className="text-green" />
      </InputGroupAddon>
      <InputGroupInput
        value={cmd.name}
        onChange={(e) => onChange('name', e.target.value)}
        placeholder="name"
        size={cmd.name.length || 4}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        className="max-w-32 min-w-8 flex-none text-2xs"
        style={{ fontFamily: MONO_FONT, fontWeight: 500 }}
      />
      <Separator orientation="vertical" className="h-3" />
      <InputGroupInput
        value={cmd.command}
        onChange={(e) => onChange('command', e.target.value)}
        placeholder="npm run dev"
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        className="text-2xs"
        style={{ fontFamily: MONO_FONT }}
      />
      <InputGroupAddon align="inline-end">
        <Button variant="ghost" size="icon-sm" onClick={onRemove} className="-mr-1 -mb-px">
          <X size={12} />
        </Button>
      </InputGroupAddon>
    </InputGroup>
  );
}

interface QuickCommandListProps {
  commands: QuickCommand[];
  onChange: (commands: QuickCommand[]) => void;
  label?: string;
}

function QuickCommandList({
  commands,
  onChange,
  label = '// quick commands'
}: QuickCommandListProps): React.JSX.Element {
  const add = (): void => {
    onChange([...commands, { name: '', command: '' }]);
  };

  const update = (index: number, field: 'name' | 'command', value: string): void => {
    onChange(commands.map((cmd, i) => (i === index ? { ...cmd, [field]: value } : cmd)));
  };

  const remove = (index: number): void => {
    onChange(commands.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        <FieldLabel>{label}</FieldLabel>
        <span className="flex-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={add}
          className="h-6 gap-1 bg-muted px-2.5 text-2xs hover:bg-muted-strong"
        >
          <Plus size={10} />
          add
        </Button>
      </div>

      <SimpleBar style={{ maxHeight: 128 }} autoHide={false}>
        <div className="flex flex-col gap-1">
          {commands.length === 0 && (
            <div
              className="rounded-control border border-dashed border-line px-2.5 py-1.5 text-left text-2xs text-ink-4"
              style={{ fontFamily: MONO_FONT }}
            >
              No commands yet
            </div>
          )}
          {commands.map((cmd, i) => (
            <QuickCommandRow
              key={i}
              cmd={cmd}
              onChange={(field, value) => update(i, field, value)}
              onRemove={() => remove(i)}
            />
          ))}
        </div>
      </SimpleBar>
    </div>
  );
}

export default QuickCommandList;
