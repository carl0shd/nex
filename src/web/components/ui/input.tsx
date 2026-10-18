import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">): React.JSX.Element {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-8 w-full min-w-0 interactive rounded-control border border-line bg-field px-2.5 text-sm text-ink outline-none placeholder:text-ink-4 not-focus:hover:border-line-strong focus:border-ring/60 focus:ring-3 focus:ring-ring/15 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
