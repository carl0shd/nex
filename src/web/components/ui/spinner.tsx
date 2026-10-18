import { cn } from "@/lib/utils";

function Spinner({ className, ...props }: React.ComponentProps<"span">): React.JSX.Element {
  return (
    <span
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block size-3.5 shrink-0 animate-spin rounded-full border-[1.5px] border-line-strong border-t-ink-2",
        className,
      )}
      {...props}
    />
  );
}

export { Spinner };
