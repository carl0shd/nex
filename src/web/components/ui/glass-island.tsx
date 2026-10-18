import { cn } from "@/lib/utils";

function GlassIsland({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
  return (
    <div
      data-slot="glass-island"
      className={cn("glass flex items-center gap-0.5 rounded-full p-0.5", className)}
      {...props}
    />
  );
}

export default GlassIsland;
