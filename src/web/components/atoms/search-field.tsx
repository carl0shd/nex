import { Search } from "lucide-react";
import { Kbd } from "@/components/atoms/kbd";
import { cn } from "@/lib/utils";

export function SearchField({
  value,
  onChange,
  placeholder,
  shortcut,
  autoFocus,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  shortcut?: string[];
  autoFocus?: boolean;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "flex h-[38px] items-center gap-2.5 rounded-field bg-field pr-2 pl-3 shadow-inset-field transition-shadow duration-150 focus-within:shadow-focus",
        className,
      )}
    >
      <Search width={14} height={14} strokeWidth={2} className="shrink-0 text-ink-4" />
      <input
        type="search"
        value={value}
        autoFocus={autoFocus}
        aria-label={placeholder}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none select-text placeholder:text-ink-4 [&::-webkit-search-cancel-button]:hidden"
      />
      {shortcut && <Kbd className="shrink-0">{shortcut.join("")}</Kbd>}
    </label>
  );
}
