import { cn } from '@/lib/utils';

interface SpecimenRowProps {
  label?: string;
  children: React.ReactNode;
  className?: string;
}

function SpecimenRow({ label, children, className }: SpecimenRowProps): React.JSX.Element {
  return (
    <div className="flex items-start gap-4">
      {label && (
        <span className="w-24 shrink-0 pt-1 font-mono text-3xs text-ink-4 select-none">
          {label}
        </span>
      )}
      <div className={cn('flex min-w-0 flex-1 flex-wrap items-center gap-3', className)}>
        {children}
      </div>
    </div>
  );
}

export default SpecimenRow;
