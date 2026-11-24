import { useState, type ReactNode } from "react";
import { Box, Code, Hammer, Play, Plus, RotateCcw, Square } from "lucide-react";
import type { EnvServiceKind, ProjectEnvironment } from "@native/db/types";
import type { EnvCheckState } from "@native/environments/types";
import { Button } from "@/components/atoms/button";
import { Expand } from "@/components/atoms/expand";
import { ServiceChip } from "@/components/atoms/service-chip";
import { Spinner } from "@/components/atoms/spinner";
import { StatusDot } from "@/components/atoms/status-dot";
import { AnchoredPopover } from "@/components/primitives/anchored-popover";
import { CommandRows } from "@/components/primitives/command-rows";
import { Disclosure } from "@/components/primitives/disclosure";
import { StatusCard } from "@/components/primitives/status-card";
import { Menu, MenuItem } from "@/components/primitives/menu";
import { ServiceDetail } from "@/components/projects/service-detail";
import { useNow } from "@/hooks/use-now";
import {
  addService,
  environmentNotices,
  groupServices,
  issuesLabel,
  removeService,
  seedSummary,
  serviceCheck,
  serviceOptions,
  serviceRole,
  sourcesLine,
  testStatus,
  updateService,
  updateSteps,
  type PinnedRole,
  type ServiceRole,
  type StepList,
  type TestStatus,
} from "@/lib/project-environment";

const MINUTE_MS = 60_000;

const GROUP_LABEL: Record<ServiceRole, string> = {
  open: "You open",
  background: "Runs in the background",
  data: "Data",
};

const EMPTY_STATUS: TestStatus = {
  tone: "idle",
  label: "Nothing found",
  hint: "Add what each task needs to run",
  busy: false,
};

const STEP_LISTS: { list: StepList; label: string; hint: string; placeholder: string }[] = [
  {
    list: "taskPrepare",
    label: "Every start",
    hint: "Runs each time a task’s environment starts, like its branch’s migrations",
    placeholder: "npx prisma migrate deploy",
  },
  {
    list: "prepare",
    label: "New data",
    hint: "Runs once when a task’s databases are created, like loading test data",
    placeholder: "npm run db:seed",
  },
];

function Issues({ problems, warnings }: { problems: string[]; warnings: string[] }) {
  const count = problems.length + warnings.length;
  if (count === 0) return null;
  const item = (text: string, tone: "red" | "orange") => (
    <li key={text} className="flex items-start gap-2 text-2xs leading-4 text-ink-3">
      <StatusDot tone={tone} className="mt-[5px]" />
      <span className="min-w-0 [overflow-wrap:anywhere]">{text}</span>
    </li>
  );
  if (count === 1) {
    return (
      <ul className="m-0 list-none p-0">
        {problems.map((text) => item(text, "red"))}
        {warnings.map((text) => item(text, "orange"))}
      </ul>
    );
  }
  return (
    <Disclosure
      align="cards"
      label={issuesLabel(count)}
      leading={<StatusDot tone={problems.length ? "red" : "orange"} />}
    >
      <ul className="m-0 flex list-none flex-col gap-1 py-1 pl-[18px]">
        {problems.map((text) => item(text, "red"))}
        {warnings.map((text) => item(text, "orange"))}
      </ul>
    </Disclosure>
  );
}

function GroupDetail({
  openIndex,
  render,
}: {
  openIndex: number | null;
  render: (index: number) => ReactNode;
}) {
  const [shown, setShown] = useState(openIndex);
  if (openIndex !== null && openIndex !== shown) setShown(openIndex);
  return <Expand open={openIndex !== null}>{shown !== null && render(shown)}</Expand>;
}

function ServiceGroup({
  label,
  trailing,
  children,
}: {
  label: string;
  trailing?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-1.5">
      <div className="flex min-h-6 min-w-0 items-center gap-1.5">
        <h3 className="m-0 shrink-0 text-xs font-normal text-ink-3">{label}</h3>
        {trailing}
      </div>
      {children}
    </section>
  );
}

function SeedSteps({
  value,
  onChange,
}: {
  value: ProjectEnvironment;
  onChange: (value: ProjectEnvironment) => void;
}) {
  return (
    <Disclosure label="Seed and migrations" summary={seedSummary(value)} align="cards">
      <div className="flex flex-col gap-3 pt-1.5 pb-1">
        {STEP_LISTS.map(({ list, label, hint, placeholder }) => (
          <div key={list} className="flex flex-col gap-1.5">
            <span className="flex flex-col gap-0.5">
              <span className="text-xs text-ink-2">{label}</span>
              <span className="text-2xs text-ink-4">{hint}</span>
            </span>
            <CommandRows
              value={(value[list] ?? []).map((step) => ({
                target: step.service,
                command: step.command,
              }))}
              targets={serviceOptions(value)}
              placeholder={placeholder}
              addLabel="Add step"
              onChange={(rows) =>
                onChange(
                  updateSteps(
                    value,
                    list,
                    rows.map((row) => ({ service: row.target, command: row.command })),
                  ),
                )
              }
            />
          </div>
        ))}
      </div>
    </Disclosure>
  );
}

function AddServiceMenu({ onAdd }: { onAdd: (kind: EnvServiceKind) => void }) {
  const [open, setOpen] = useState(false);
  const add = (kind: EnvServiceKind) => {
    onAdd(kind);
    setOpen(false);
  };
  return (
    <AnchoredPopover
      open={open}
      onOpenChange={setOpen}
      side="bottom"
      strategy="fixed"
      className="-ml-1.5"
      trigger={
        <Button variant="quiet" size="xs" onClick={() => setOpen((next) => !next)}>
          <Plus width={11} height={11} strokeWidth={2.25} />
          Add service
        </Button>
      }
    >
      <Menu width={280}>
        <MenuItem icon={Box} description="Postgres, Redis, Mailpit…" onSelect={() => add("image")}>
          A ready image
        </MenuItem>
        <MenuItem
          icon={Hammer}
          description="Builds an image from a Dockerfile in this project"
          onSelect={() => add("build")}
        >
          Built from a Dockerfile
        </MenuItem>
        <MenuItem
          icon={Code}
          description="Runs a command on this project’s code"
          onSelect={() => add("app")}
        >
          This project’s code
        </MenuItem>
      </Menu>
    </AnchoredPopover>
  );
}

function TestButton({
  checking,
  disabledReason,
  onCheck,
  onStop,
}: {
  checking: boolean;
  disabledReason: string | null;
  onCheck?: () => void;
  onStop?: () => void;
}) {
  if (checking && onStop) {
    return (
      <Button size="xs" onClick={onStop}>
        <Square width={9} height={9} strokeWidth={2.5} />
        Stop
      </Button>
    );
  }
  if (!onCheck) return null;
  return (
    <Button
      variant="primary"
      size="xs"
      disabled={checking || disabledReason !== null}
      title={disabledReason ?? undefined}
      onClick={onCheck}
    >
      <Play width={10} height={10} strokeWidth={2.5} />
      Test it
    </Button>
  );
}

export function EnvironmentEditor({
  value,
  onChange,
  check = null,
  canCheck = false,
  onCheck,
  onStopCheck,
  onDetectAgain,
  detecting = false,
  initialOpen = null,
}: {
  value: ProjectEnvironment;
  onChange: (value: ProjectEnvironment) => void;
  check?: EnvCheckState | null;
  canCheck?: boolean;
  onCheck?: () => void;
  onStopCheck?: () => void;
  onDetectAgain?: () => void;
  detecting?: boolean;
  initialOpen?: number | null;
}) {
  const pin = (index: number): PinnedRole | null => {
    const service = value.services[index];
    return service ? { index, role: serviceRole(service) } : null;
  };
  const [open, setOpen] = useState<PinnedRole | null>(() =>
    initialOpen === null ? null : pin(initialOpen),
  );
  const now = useNow(MINUTE_MS);
  const { problems, warnings } = environmentNotices(value);
  const checking = check?.phase === "running";
  const groups = groupServices(value, open);
  const hasSteps = Boolean(value.prepare?.length || value.taskPrepare?.length);
  const status = value.services.length === 0 ? EMPTY_STATUS : testStatus(check, now);
  const blocked = !canCheck
    ? "Set up environments first"
    : problems.length > 0
      ? "Fix what’s flagged above first"
      : null;

  const detail = (index: number) => {
    const service = value.services[index];
    if (!service) return null;
    return (
      <ServiceDetail
        key={index}
        env={value}
        service={service}
        check={serviceCheck(check, service.name)}
        opensInBrowser={serviceRole(service) === "open"}
        onChange={(patch) => onChange(updateService(value, service.name, patch))}
        onRemove={() => {
          setOpen(null);
          onChange(removeService(value, service.name));
        }}
      />
    );
  };

  const group = (role: ServiceRole, trailing?: ReactNode, footer?: ReactNode) => (
    <ServiceGroup key={role} label={GROUP_LABEL[role]} trailing={trailing}>
      {groups[role].length > 0 && (
        <div className="flex min-w-0 flex-wrap gap-1.5">
          {groups[role].map((index) => {
            const service = value.services[index];
            if (!service) return null;
            return (
              <ServiceChip
                key={index}
                name={service.name || "Unnamed"}
                tone={serviceCheck(check, service.name)?.tone}
                selected={open?.index === index}
                onClick={() => setOpen(open?.index === index ? null : pin(index))}
              />
            );
          })}
        </div>
      )}
      <GroupDetail openIndex={open?.role === role ? open.index : null} render={detail} />
      {footer}
    </ServiceGroup>
  );

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <StatusCard
          tone={status.tone}
          busy={status.busy}
          title={status.label}
          hint={status.hint}
          action={
            <TestButton
              checking={checking}
              disabledReason={value.services.length === 0 ? "Add a service first" : blocked}
              onCheck={onCheck}
              onStop={onStopCheck}
            />
          }
        />
        <Issues problems={problems} warnings={warnings} />
      </div>

      {groups.open.length > 0 && group("open")}
      {groups.background.length > 0 && group("background")}
      {(groups.data.length > 0 || hasSteps) &&
        group("data", undefined, <SeedSteps value={value} onChange={onChange} />)}

      <div className="flex items-center gap-2">
        <AddServiceMenu
          onAdd={(kind) => {
            const added = addService(value, kind);
            const index = added.env.services.length - 1;
            const service = added.env.services[index];
            onChange(added.env);
            if (service) setOpen({ index, role: serviceRole(service) });
          }}
        />
        {onDetectAgain && (
          <Button
            variant="quiet"
            size="xs"
            className="ml-auto"
            title={sourcesLine(value)}
            disabled={detecting || checking}
            onClick={onDetectAgain}
          >
            {detecting ? (
              <Spinner className="size-3" />
            ) : (
              <RotateCcw width={11} height={11} strokeWidth={2.25} />
            )}
            Detect again
          </Button>
        )}
      </div>
    </div>
  );
}
