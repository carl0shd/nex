import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> & {
  "aria-label": string;
  size?: "sm" | "md";
  pressed?: boolean;
  children: ReactNode;
};

export function IconButton({
  size = "md",
  pressed = false,
  className,
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={cn(
        "interactive press flex shrink-0 cursor-pointer items-center justify-center rounded-full select-none",
        size === "md" ? "size-[30px]" : "size-7",
        pressed ? "bg-hover-2 text-ink" : "text-ink-3 hover:bg-hover hover:text-ink",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
