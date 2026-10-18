import { cn } from '@/lib/utils';

interface SpecimenItemProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

function SpecimenItem({ label, children, className }: SpecimenItemProps): React.JSX.Element {
  return (
    <div className={cn('flex flex-col items-start gap-1.5', className)}>
      {children}
      <span className="font-mono text-3xs text-ink-4 select-none">{label}</span>
    </div>
  );
}

export default SpecimenItem;
