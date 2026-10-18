import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SpecimenProps {
  name: string;
  source: string;
  children: React.ReactNode;
  className?: string;
}

function Specimen({ name, source, children, className }: SpecimenProps): React.JSX.Element {
  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="flex items-baseline justify-between gap-3 border-b border-line-soft px-3 py-2">
        <span className="text-xs font-medium text-ink select-none">{name}</span>
        <span className="truncate font-mono text-3xs text-ink-3 select-text">{source}</span>
      </div>
      <div className={cn("flex flex-col gap-4 bg-page p-4", className)}>{children}</div>
    </Card>
  );
}

export default Specimen;
