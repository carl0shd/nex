import { useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function SelectionAsk({
  label,
  onSend,
  onCancel,
  className,
}: {
  label: string;
  onSend?: (question: string) => void;
  onCancel?: () => void;
  className?: string;
}) {
  const [question, setQuestion] = useState("");
  const send = () => {
    if (!question.trim()) return;
    onSend?.(question.trim());
    setQuestion("");
  };
  return (
    <div
      className={cn(
        "enter-toast flex items-center gap-2 rounded-full bg-glass py-1.5 pr-1.5 pl-2 shadow-[0_0_0_1px_var(--line-strong),0_10px_28px_-10px_rgb(0_0_0/60%)] backdrop-blur-[28px]",
        className,
      )}
    >
      <span className="flex h-[22px] shrink-0 items-center rounded-full bg-accent/18 px-2 font-mono text-3xs text-accent-ink">
        {label}
      </span>
      <input
        aria-label="Ask Claude about the selected lines"
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") send();
          if (event.key === "Escape") onCancel?.();
        }}
        placeholder="Ask Claude about these lines…"
        className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-4"
      />
      <button
        type="button"
        aria-label="Send to Claude"
        onClick={send}
        className="interactive press flex size-[30px] shrink-0 cursor-pointer items-center justify-center rounded-full bg-accent text-on-accent select-none hover:bg-accent-hover"
      >
        <ArrowUp width={14} height={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}
