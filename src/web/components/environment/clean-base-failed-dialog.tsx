import { Database, X } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { CheckList, type CheckItem } from "@/components/onboarding/check-list";
import { ModalCard, StatusIcon } from "@/components/primitives/modal-card";

export interface CleanBaseFailure {
  project: string;
  steps: readonly CheckItem[];
  error: string;
}

export function CleanBaseFailedDialog({
  failure,
  onClose,
  onViewLog,
  onEditSetup,
  onRetry,
}: {
  failure: CleanBaseFailure;
  onClose?: () => void;
  onViewLog?: () => void;
  onEditSetup?: () => void;
  onRetry?: () => void;
}) {
  const failedAt = failure.steps.findIndex((step) => step.state === "failed");
  return (
    <ModalCard
      title={`Couldn’t prepare the clean base for ${failure.project}`}
      icon={<StatusIcon tone="red" icon={X} />}
      onClose={onClose}
      footer={
        <>
          <Button variant="quiet" size="sm" onClick={onViewLog}>
            View log
          </Button>
          <span className="ml-auto" />
          <Button onClick={onEditSetup}>Edit setup</Button>
          <Button variant="primary" onClick={onRetry}>
            Try again
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-2">
        <CheckList items={failure.steps.slice(0, failedAt + 1)} />
        <span className="ml-[30px] rounded-control bg-inset px-2.5 py-2 font-mono text-2xs text-ink shadow-[inset_0_0_0_1px_var(--line-soft)] select-text">
          {failure.error}
        </span>
        <CheckList items={failure.steps.slice(failedAt + 1)} />
        <p className="m-0 mt-1 flex items-center gap-2 text-xs text-ink-4">
          <Database width={13} height={13} strokeWidth={2} />
          Until it works, new tasks start with an empty database.
        </p>
      </div>
    </ModalCard>
  );
}
