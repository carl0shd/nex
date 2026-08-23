import SimpleBar from 'simplebar-react';
import { useScrollable } from '@/hooks/use-scrollable';
import { cn } from '@/lib/utils';

interface SettingsPanelProps {
  header?: React.ReactNode;
  children: React.ReactNode;
}

function SettingsPanel({ header, children }: SettingsPanelProps): React.JSX.Element {
  const [scrollRef, isScrollable] = useScrollable();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      {header}
      <div className="min-h-0 flex-1">
        <SimpleBar ref={scrollRef} style={{ maxHeight: '100%' }} autoHide={false}>
          <div className={cn('flex flex-col gap-5', isScrollable && 'pr-3')}>{children}</div>
        </SimpleBar>
      </div>
    </div>
  );
}

export default SettingsPanel;
