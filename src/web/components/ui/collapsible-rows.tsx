import { cn } from "@/lib/utils";

interface CollapsibleRowsProps {
  open: boolean;
  railVisible?: boolean;
  children: React.ReactNode;
  className?: string;
}

function CollapsibleRows({
  open,
  railVisible = false,
  children,
  className,
}: CollapsibleRowsProps): React.JSX.Element {
  return (
    <div
      data-slot="collapsible-rows"
      data-open={open}
      data-rail={railVisible ? "visible" : undefined}
      className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-280 ease-glide data-[open=true]:grid-rows-[1fr]"
    >
      <div className={cn("min-h-0 overflow-hidden", className)}>{children}</div>
    </div>
  );
}

export default CollapsibleRows;
