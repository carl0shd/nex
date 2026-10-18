import { Kbd } from '@/components/ui/kbd';

interface ShortcutKeyProps {
  keys: string;
  label: string;
}

function ShortcutKey({ keys, label }: ShortcutKeyProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <Kbd>{keys}</Kbd>
      <span className="text-2xs text-ink-3">{label}</span>
    </div>
  );
}

export default ShortcutKey;
