import { useLayoutEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

interface SegmentedControlOption<T extends string> {
  value: T;
  label?: string;
  icon?: LucideIcon;
  title?: string;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  options: SegmentedControlOption<T>[];
  onChange: (value: T) => void;
  size?: "sm" | "default" | "lg";
  className?: string;
}

interface ThumbBox {
  left: number;
  width: number;
}

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  size = "sm",
  className,
}: SegmentedControlProps<T>): React.JSX.Element {
  const rootRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<ThumbBox | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const active = root?.querySelector<HTMLElement>('[data-state="on"]');
    if (!root || !active) return;
    const measure = (): void => setThumb({ left: active.offsetLeft, width: active.offsetWidth });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [value, options]);

  return (
    <ToggleGroup
      ref={rootRef}
      type="single"
      variant="outline"
      size={size}
      value={value}
      // Radix reports an empty string when the pressed item is toggled off; a
      // segmented control always keeps exactly one option selected.
      onValueChange={(next) => next && onChange(next as T)}
      className={cn("relative isolate", className)}
    >
      <span
        aria-hidden
        className="absolute inset-y-0.5 -z-10 rounded-full bg-surface shadow-btn"
        style={{
          left: thumb?.left ?? 0,
          width: thumb?.width ?? 0,
          opacity: thumb ? 1 : 0,
          transition: thumb
            ? "left 220ms var(--ease-out-strong), width 220ms var(--ease-out-strong)"
            : undefined,
        }}
      />
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          title={option.title ?? option.label}
          className="data-[state=on]:bg-transparent data-[state=on]:shadow-none"
        >
          {option.icon && <option.icon size={13} />}
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export default SegmentedControl;
export type { SegmentedControlOption };
