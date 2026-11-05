import { Plus, SquareTerminal } from "lucide-react";
import { Button } from "@/components/atoms/button";

export function NoTerminals({ onNew }: { onNew?: () => void }) {
  return (
    <div className="enter-step flex flex-1 flex-col items-center justify-center gap-3 text-center">
      <SquareTerminal width={22} height={22} strokeWidth={1.75} className="text-ink-4" />
      <span className="text-sm text-ink-3">No terminals open</span>
      <Button size="sm" onClick={onNew}>
        <Plus width={12} height={12} strokeWidth={2.25} />
        New terminal
      </Button>
    </div>
  );
}
