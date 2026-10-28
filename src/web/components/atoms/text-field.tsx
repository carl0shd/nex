import { useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label?: string;
  hint?: React.ReactNode;
  mono?: boolean;
  size?: "md" | "lg";
};

export function TextField({
  label,
  hint,
  mono = false,
  size = "lg",
  className,
  id,
  ...props
}: TextFieldProps) {
  const generated = useId();
  const inputId = id ?? generated;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-ink-3">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "w-full bg-field px-3 text-ink shadow-inset-field outline-none transition-shadow duration-150 select-text placeholder:text-ink-4 focus:shadow-focus",
          size === "lg" ? "h-9 rounded-field" : "h-[34px] rounded-control",
          mono ? "font-mono text-sm" : "text-sm",
          className,
        )}
        {...props}
      />
      {hint && <span className="text-xs text-ink-4">{hint}</span>}
    </div>
  );
}
