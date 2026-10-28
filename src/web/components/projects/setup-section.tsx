import type { ComponentType, ReactNode } from "react";
import { Button } from "@/components/atoms/button";
import type { Phrase } from "@/lib/project-summary";
import { cn } from "@/lib/utils";

type SectionIcon = ComponentType<{ width?: number; height?: number; strokeWidth?: number }>;

export function PhraseText({ phrase }: { phrase: Phrase }) {
  return (
    <>
      {phrase.map((part, index) =>
        part.code ? (
          <span key={index} className="font-mono text-xs text-ink">
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
      <div className="flex min-h-10 items-center gap-3 px-3">
        <span
          className={cn(
            "flex size-[26px] shrink-0 items-center justify-center rounded-control",
            open ? "bg-accent-tint text-accent-ink" : "bg-hover-2 text-ink-3",
          )}
        >
          <Icon width={13} height={13} strokeWidth={2} />
        </span>
        <span className={cn("flex-1 text-sm", open ? "text-ink" : "text-ink-2")}>
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
      {open && <div className="rise-in flex flex-col gap-3 pr-3 pb-3 pl-[50px]">{children}</div>}
    </div>
  );
}
