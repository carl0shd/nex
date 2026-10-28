import { useState } from "react";
import { Check, Copy } from "iconoir-react";
import { IconButton } from "@/components/atoms/icon-button";

export function CommandBox({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex h-9 items-center gap-2 rounded-control bg-inset pr-1 pl-3 shadow-[inset_0_0_0_1px_var(--line)]">
      <span className="font-mono text-xs text-ink-4">$</span>
      <span className="min-w-0 flex-1 truncate font-mono text-xs text-ink select-text">
        {command}
      </span>
      <IconButton
        aria-label={copied ? "Copied" : "Copy command"}
        size="sm"
        onClick={() => {
          void navigator.clipboard?.writeText(command);
          setCopied(true);
        }}
      >
        {copied ? (
          <Check width={12} height={12} strokeWidth={2.5} className="text-green" />
        ) : (
          <Copy width={12} height={12} strokeWidth={2} />
        )}
      </IconButton>
    </div>
  );
}
