import { cn } from '@/lib/utils';

interface PanelSectionProps {
  title: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

function PanelSection({
  title,
  trailing,
  children,
  className
}: PanelSectionProps): React.JSX.Element {
  return (
    <section className={cn('flex flex-col gap-1.5', className)}>
      <header className="flex items-baseline justify-between gap-3">
        <h3 className="text-[10px] font-medium tracking-wide text-text-muted uppercase">{title}</h3>
        {trailing}
      </header>
      {children}
    </section>
  );
}

export default PanelSection;
