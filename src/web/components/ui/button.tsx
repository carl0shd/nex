import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "interactive press inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full font-medium whitespace-nowrap select-none outline-none disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-solid hover:bg-primary-hover",
        secondary: "bg-surface text-ink shadow-btn hover:bg-muted aria-expanded:bg-muted",
        outline:
          "text-ink-2 shadow-hairline hover:bg-hover hover:text-ink hover:shadow-[0_0_0_1px_var(--line-strong)] aria-expanded:bg-hover aria-expanded:text-ink",
        ghost: "text-ink-3 hover:bg-hover-2 hover:text-ink aria-expanded:bg-hover-2",
        destructive:
          "bg-red/12 text-red shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--red)_18%,transparent)] hover:bg-red/20",
        link: "text-primary-ink underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 px-3.5 text-sm",
        xs: "h-6 gap-1 px-2.5 text-2xs",
        sm: "h-7 gap-1 px-3 text-xs",
        lg: "h-9 px-4 text-sm",
        icon: "size-7",
        "icon-sm": "size-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps): React.JSX.Element {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
export type { ButtonProps };
