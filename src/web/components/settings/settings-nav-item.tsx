import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SettingsNavItemProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function SettingsNavItem({ label, active, onClick }: SettingsNavItemProps): React.JSX.Element {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn(
        'w-full justify-start px-3 py-1.75 text-xs',
        active ? 'bg-muted text-ink hover:bg-muted' : 'text-ink-2 hover:bg-muted/50 hover:text-ink'
      )}
    >
      {label}
    </Button>
  );
}

export default memo(SettingsNavItem);
