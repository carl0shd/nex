import { cn } from "@/lib/utils";

function Shimmer({ className, ...props }: React.ComponentProps<"span">): React.JSX.Element {
  return (
    <span data-slot="shimmer" className={cn("shimmer-text inline-block", className)} {...props} />
  );
}

export { Shimmer };
