import { Plus, X, Play } from 'lucide-react';
import SimpleBar from 'simplebar-react';
import type { QuickCommand } from '@native/db/types';

interface QuickCommandRowProps {
  cmd: QuickCommand;
  onChange: (field: 'name' | 'command', value: string) => void;
  onRemove: () => void;
}

function QuickCommandRow({ cmd, onChange, onRemove }: QuickCommandRowProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-2 rounded border border-border-soft px-2.5 py-1 hover:border-border">
      <Play size={10} className="shrink-0 text-badge-success-text" />
      <input
        type="text"
        value={cmd.name}
        onChange={(e) => onChange('name', e.target.value)}
        placeholder="name"
        size={cmd.name.length || 4}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        className="max-w-32 min-w-8 bg-transparent text-[11px] text-text-secondary placeholder:text-text-placeholder outline-none"
        style={{
          fontFamily: 'JetBrains Mono Variable, JetBrains Mono, monospace',
          fontWeight: 500
        }}
      />
      <div className="h-3 w-px bg-border-soft" />
      <input
        type="text"
        value={cmd.command}
        onChange={(e) => onChange('command', e.target.value)}
        placeholder="npm run dev"
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        className="flex-1 bg-transparent text-[11px] text-text-secondary placeholder:text-text-placeholder outline-none"
        style={{ fontFamily: 'JetBrains Mono Variable, JetBrains Mono, monospace' }}
      />
      <button
        onClick={onRemove}
        className="-mr-1 -mb-px cursor-pointer p-1 text-text-muted hover:text-text-secondary"
      >
        <X size={12} />
      </button>
    </div>
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
        <span className="text-[10px] font-medium text-text-muted">{label}</span>
        <span className="flex-1" />
        <button
          onClick={add}
          className="flex cursor-pointer items-center gap-1 rounded-[3px] bg-bg-raised px-2 py-0.5 text-[10px] font-medium text-text-muted hover:bg-bg-hover hover:text-text-secondary"
        >
          <Plus size={10} />
          add
        </button>
      </div>

      <SimpleBar style={{ maxHeight: 128 }} autoHide={false}>
        <div className="flex flex-col gap-1">
          {commands.length === 0 && (
            <div
              className="rounded border border-dashed border-border-soft px-2.5 py-1.25 text-left text-[11px] text-text-placeholder"
              style={{ fontFamily: 'JetBrains Mono Variable, JetBrains Mono, monospace' }}
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
