import { ChevronDown, LayoutGrid, SquarePen } from "lucide-react";
import { ColorSwatches } from "@/components/atoms/color-swatches";
import { Monogram } from "@/components/atoms/entity-chip";
import { TextField } from "@/components/atoms/text-field";
import { OnboardingStep } from "@/components/onboarding/onboarding-step";
import { WorkspaceBadgePicker } from "@/components/sidebar/workspace-badge-picker";
import { cn } from "@/lib/utils";
import type { WorkspaceIconName } from "@/lib/workspace-icons";

export interface WorkspaceDraft {
  name: string;
  color: string;
  image: string | null;
  icon?: WorkspaceIconName | null;
}

function Skeleton({ className }: { className?: string }) {
  return <span className={cn("block h-2 rounded-full bg-hover-2", className)} />;
}

function WorkspacePreview({ workspace }: { workspace: WorkspaceDraft }) {
  const name = workspace.name.trim() || "Workspace";
  return (
    <div
      aria-label="Preview"
      className="flex h-[440px] overflow-hidden rounded-sheet bg-page shadow-[0_0_0_1px_var(--line),0_24px_48px_-20px_rgb(0_0_0/60%)]"
    >
      <div className="flex w-[230px] shrink-0 flex-col gap-1 border-r border-line p-3">
        <div aria-hidden className="mb-3 flex gap-2 px-1">
          {[0, 1, 2].map((dot) => (
            <span key={dot} className="size-3 rounded-full bg-ink-6" />
          ))}
        </div>
        <span className="flex h-8 items-center gap-2 px-2 text-sm font-medium text-ink-2">
          <SquarePen width={14} height={14} strokeWidth={2} className="text-accent-ink" />
          New task
        </span>
        <span className="flex h-8 items-center gap-2 rounded-control bg-surface px-2 text-sm font-medium text-ink shadow-hairline">
          <LayoutGrid width={14} height={14} strokeWidth={2} />
          Overview
        </span>
        <span className="mt-4 flex h-8 items-center gap-2 px-2">
          <Monogram
            color={workspace.color}
            image={workspace.image ?? undefined}
            icon={workspace.icon}
          >
            {name[0]?.toUpperCase()}
          </Monogram>
          <span className="truncate text-sm font-semibold text-ink">{name}</span>
          <ChevronDown width={12} height={12} strokeWidth={2} className="text-ink-4" />
        </span>
        <div aria-hidden className="mt-1 flex flex-col gap-3 pl-5">
          <Skeleton className="w-24" />
          <div className="flex flex-col gap-3 border-l border-line pl-3">
            <Skeleton className="w-28" />
            <Skeleton className="w-20" />
          </div>
        </div>
      </div>
      <div aria-hidden className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex flex-1 flex-col gap-4 rounded-panel bg-surface p-4 shadow-card">
          <Skeleton className="w-40" />
          <div className="flex gap-2">
            {["w-14", "w-[72px]", "w-12", "w-16"].map((width) => (
              <Skeleton key={width} className={cn("h-5 rounded-chip", width)} />
            ))}
          </div>
          <div className="flex flex-col gap-2.5">
            <Skeleton className="w-[85%]" />
            <Skeleton className="w-[70%]" />
            <Skeleton className="w-[78%]" />
          </div>
          <Skeleton className="mt-auto h-10 rounded-field" />
        </div>
      </div>
    </div>
  );
}

export function WorkspaceStep({
  workspace,
  onChange,
  onBack,
  onContinue,
  saving = false,
}: {
  workspace: WorkspaceDraft;
  onChange: (workspace: WorkspaceDraft) => void;
  onBack?: () => void;
  onContinue?: () => void;
  saving?: boolean;
}) {
  return (
    <OnboardingStep
      step={2}
      title="Create a workspace"
      description="Group the repos you work on together: a client, a team, or just personal. You can add more later."
      onBack={onBack}
      primary={{
        label: saving ? "Creating…" : "Continue",
        onClick: onContinue,
        disabled: !workspace.name.trim() || saving,
      }}
      aside={<WorkspacePreview workspace={workspace} />}
    >
      <TextField
        label="Name"
        value={workspace.name}
        autoFocus
        onChange={(event) => onChange({ ...workspace, name: event.target.value })}
      />
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-ink-3">Color</span>
        <ColorSwatches
          value={workspace.color}
          onChange={(color) => onChange({ ...workspace, color })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-ink-3">Badge</span>
        <WorkspaceBadgePicker
          hasImage={Boolean(workspace.image)}
          icon={workspace.icon}
          onChange={(badge) => onChange({ ...workspace, ...badge })}
        />
      </div>
    </OnboardingStep>
  );
}
