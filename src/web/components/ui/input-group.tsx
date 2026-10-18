import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

function InputGroup({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean }): React.JSX.Element {
  const Comp = asChild ? Slot.Root : "div";

  return (
    <Comp
      data-slot="input-group"
      className={cn(
        "interactive flex h-8 items-center gap-2 rounded-control border border-line bg-field px-2.5 not-focus-within:hover:border-line-strong focus-within:border-ring/60 focus-within:ring-3 focus-within:ring-ring/15 has-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

const inputGroupAddonVariants = cva("flex shrink-0 items-center gap-1.5 text-ink-3", {
  variants: {
    align: {
      "inline-start": "order-first",
      "inline-end": "order-last",
    },
  },
  defaultVariants: {
    align: "inline-start",
  },
});

function InputGroupAddon({
  className,
  align,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>): React.JSX.Element {
  return (
    <div
      data-slot="input-group-addon"
      className={cn(inputGroupAddonVariants({ align, className }))}
      {...props}
    />
  );
}

function InputGroupInput({
  className,
  ...props
}: React.ComponentProps<"input">): React.JSX.Element {
  return (
    <input
      type="text"
      data-slot="input-group-control"
      className={cn(
        "min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-4 disabled:pointer-events-none",
        className,
      )}
      {...props}
    />
  );
}

export { InputGroup, InputGroupAddon, InputGroupInput };
