import { Button } from "@/components/atoms/button";
import { StatusDot } from "@/components/atoms/status-dot";

export function AddressStatus({
  resolving,
  domain,
  onRepair,
}: {
  resolving: boolean;
  domain: string;
  onRepair?: () => void;
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5">
      <span className="flex flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium text-ink">Address</span>
        <span className="flex items-center gap-1.5 text-xs text-ink-3">
          <StatusDot tone={resolving ? "green" : "red"} size={5} />
          {resolving ? `${domain} resolves on this Mac` : `${domain} isn’t resolving`}
        </span>
      </span>
      {!resolving && (
        <Button size="sm" onClick={onRepair}>
          Repair
        </Button>
      )}
    </div>
  );
}
