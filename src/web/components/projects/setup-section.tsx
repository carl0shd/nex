import type { ComponentType, ReactNode } from "react";
import { Button } from "@/components/atoms/button";
import type { Phrase } from "@/lib/project-summary";
import { cn } from "@/lib/utils";

type SectionIcon = ComponentType<{ width?: number; height?: number; strokeWidth?: number }>;

export function PhraseText({ phrase }: { phrase: Phrase }) {
  return (
    <>
      {phrase.map((part, index) =>
        part.code || part.name ? (
          <span
            key={index}
            title={part.text}
            className={cn(
              "inline-block max-w-[200px] truncate align-bottom text-ink",
              part.code && "font-mono text-xs",
            )}
          >
            {part.text}
          </span>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </>
  );
}

export function SetupSection({
  icon: Icon,
  phrase,
  open,
  onToggle,
  children,
}: {
  icon: SectionIcon;
  phrase: Phrase;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-field transition-[background-color,box-shadow] duration-200",
        open && "bg-hover/60 shadow-[inset_0_0_0_1px_var(--line-strong)]",
      )}
    >
      <div
        className={cn(
          "flex min-h-10 items-center gap-3 px-3.5 transition-[padding] duration-200 ease-out",
          open && "py-2.5",
        )}
      >
        <span
          className={cn(
            "flex size-[26px] shrink-0 items-center justify-center rounded-control",
            open ? "bg-accent-tint text-accent-ink" : "bg-hover-2 text-ink-3",
          )}
        >
          <Icon width={13} height={13} strokeWidth={2} />
        </span>
        <span className={cn("min-w-0 flex-1 truncate text-sm", open ? "text-ink" : "text-ink-2")}>
          <PhraseText phrase={phrase} />
        </span>
        {open ? (
          <Button variant="inverse" size="xs" onClick={onToggle}>
            Done
          </Button>
        ) : (
          <Button variant="quiet" size="xs" onClick={onToggle}>
            Edit
          </Button>
        )}
      </div>
      {open && (
        <div className="rise-in flex flex-col gap-3 pt-0.5 pr-3.5 pb-3.5 pl-[52px]">{children}</div>
      )}
    </div>
  );
}
