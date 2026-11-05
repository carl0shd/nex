import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { KeyText } from "@/components/atoms/kbd";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 font-medium whitespace-nowrap select-none interactive press disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "rounded-full bg-accent text-on-accent shadow-solid hover:bg-accent-hover",
        secondary:
          "rounded-full bg-transparent text-ink-2 shadow-btn hover:bg-hover hover:text-ink",
        inverse: "rounded-full bg-ink text-inverse hover:opacity-90",
        danger: "rounded-full bg-red-solid text-white shadow-solid hover:brightness-110",
        ghost: "rounded-full bg-hover-2 text-ink hover:bg-line-focus",
        quiet: "rounded-control bg-transparent text-ink-3 hover:bg-hover hover:text-ink-2",
        destructive: "rounded-control bg-transparent text-red hover:bg-red-tint",
        accent: "rounded-full bg-accent text-on-accent shadow-solid hover:bg-accent-hover",
        success: "rounded-full bg-accent text-on-accent shadow-solid hover:bg-accent-hover",
      },
      size: {
        xs: "h-6 px-2.5 text-2xs",
        sm: "h-7 px-3 text-xs",
        md: "h-[34px] px-4 text-sm",
        lg: "h-9 px-4 text-sm",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { kbd?: ReactNode };

export function Button({ variant, size, kbd, className, children, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(buttonVariants({ variant, size }), kbd && "gap-2.5 pr-2", className)}
      {...props}
    >
      {children}
      {kbd && (
        <span className="rounded-chip bg-white/15 px-1.5 py-0.5 text-3xs leading-none">
          <KeyText>{kbd}</KeyText>
        </span>
      )}
    </button>
  );
}
