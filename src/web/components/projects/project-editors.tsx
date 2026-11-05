import { useState, type ReactNode } from "react";
import { Database, Ellipsis, Globe, Play, Plus, X } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { Checkbox } from "@/components/atoms/checkbox";
import { IconButton } from "@/components/atoms/icon-button";
import { StatusDot } from "@/components/atoms/status-dot";
import { Switch } from "@/components/atoms/switch";
import { TextField } from "@/components/atoms/text-field";
import { CheckList } from "@/components/onboarding/check-list";
import { SelectMenu } from "@/components/primitives/select-menu";
import { taskBranchName } from "@/lib/task-branch";
import type { WorktreeSetup } from "@/lib/project-summary";
import { cn } from "@/lib/utils";

export interface BranchConfig {
  base: string;
  prefix: string;
  pull: boolean;
}

export interface QuickCommand {
  name: string;
  command: string;
  on: boolean;
}

export interface BrowserService {
  name: string;
  port: number;
  command: string;
  address: string;
}

export interface InternalService {
  name: string;
  port: number;
  note: string;
}

export interface ProjectEnvironment {
  browser: readonly BrowserService[];
  internal: readonly InternalService[];
  values: readonly { key: string; value: string }[];
  cleanBase: { detail: string; steps: readonly string[] };
}

function Field({ className, ...props }: React.ComponentProps<typeof TextField>) {
  return (
    <TextField
      mono
      size="md"
      className={cn("h-[30px] rounded-control text-xs", className)}
      {...props}
    />
  );
}

function Divider() {
  return <span className="h-px bg-line" />;
}

function Note({ children }: { children: ReactNode }) {
  return <p className="m-0 text-2xs leading-[16px] text-ink-4">{children}</p>;
}

export function BranchEditor({
  value,
  branches,
  onChange,
}: {
  value: BranchConfig;
  branches: readonly string[];
  onChange: (value: BranchConfig) => void;
}) {
  const prefix = value.prefix.replace(/\/+$/, "") || "feat";
  return (
    <>
      <div className="grid grid-cols-2 gap-2.5">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-ink-3">Base branch</span>
          <SelectMenu
            value={value.base}
            options={branches.map((branch, index) => ({
              value: branch,
              label: index === 0 ? `${branch} · default` : branch,
            }))}
            onChange={(base) => onChange({ ...value, base })}
            className="w-full min-w-0"
          />
        </label>
        <Field
          label="Prefix"
          value={value.prefix}
          onChange={(event) => onChange({ ...value, prefix: event.target.value })}
        />
      </div>
      <Note>
        “Fix login redirect” becomes{" "}
        <span className="font-mono text-ink-2">{taskBranchName("Fix login redirect", prefix)}</span>
      </Note>
      <Divider />
      <div className="flex items-center gap-3">
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex min-w-0 text-sm font-medium text-ink">
            <span className="shrink-0">Pull&nbsp;</span>
            <span title={value.base} className="truncate">
              {value.base}
            </span>
            <span className="shrink-0">&nbsp;before each new task</span>
          </span>
          <span className="text-xs text-ink-3">So agents never start from a stale base.</span>
        </span>
        <Switch size="sm" checked={value.pull} onChange={(pull) => onChange({ ...value, pull })} />
      </div>
    </>
  );
}

function FileChip({ name, onRemove }: { name: string; onRemove: () => void }) {
  return (
    <span className="flex h-6 items-center gap-1 rounded-chip pr-0.5 pl-2 font-mono text-2xs text-ink shadow-[inset_0_0_0_1px_var(--line-strong)]">
      {name}
      <IconButton aria-label={`Remove ${name}`} size="sm" onClick={onRemove} className="size-5">
        <X width={10} height={10} strokeWidth={2.5} />
      </IconButton>
    </span>
  );
}

function SetupLine({
  checked,
  onCheck,
  label,
  children,
}: {
  checked: boolean;
  onCheck: (checked: boolean) => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[180px_minmax(0,1fr)] items-center gap-2.5">
      <span className="flex items-center gap-2.5 text-sm text-ink">
        <Checkbox checked={checked} onChange={onCheck} label={label} />
        {label}
      </span>
      {children}
    </div>
  );
}

export function WorktreeSetupEditor({
  value,
  detectedFrom,
  onChange,
}: {
  value: WorktreeSetup;
  detectedFrom: readonly string[];
  onChange: (value: WorktreeSetup) => void;
}) {
  const [adding, setAdding] = useState("");
  const addFile = () => {
    const file = adding.trim();
    if (!file || value.copy.files.includes(file)) return setAdding("");
    onChange({ ...value, copy: { on: true, files: [...value.copy.files, file] } });
    setAdding("");
  };
  return (
    <>
      <SetupLine
        label="Install dependencies"
        checked={value.install.on}
        onCheck={(on) => onChange({ ...value, install: { ...value.install, on } })}
      >
        <Field
          aria-label="Install command"
          value={value.install.command}
          disabled={!value.install.on}
          onChange={(event) =>
            onChange({ ...value, install: { ...value.install, command: event.target.value } })
          }
        />
      </SetupLine>
      <SetupLine
        label="Copy from your checkout"
        checked={value.copy.on}
        onCheck={(on) => onChange({ ...value, copy: { ...value.copy, on } })}
      >
        <span className="flex flex-wrap items-center gap-1.5">
          {value.copy.files.map((file) => (
            <FileChip
              key={file}
              name={file}
              onRemove={() =>
                onChange({
                  ...value,
                  copy: { ...value.copy, files: value.copy.files.filter((item) => item !== file) },
                })
              }
            />
          ))}
          <input
            aria-label="Add file"
            value={adding}
            placeholder="+ Add file"
            onChange={(event) => setAdding(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && addFile()}
            onBlur={addFile}
            className="h-6 w-24 rounded-chip bg-transparent px-2 font-mono text-2xs text-ink outline-none select-text placeholder:font-sans placeholder:text-ink-3 focus:shadow-[inset_0_0_0_1px_var(--line-focus)]"
          />
        </span>
      </SetupLine>
      <SetupLine
        label="Run a script"
        checked={value.script.on}
        onCheck={(on) => onChange({ ...value, script: { ...value.script, on } })}
      >
        <Field
          aria-label="Setup script"
          value={value.script.path}
          placeholder="scripts/setup.sh"
          disabled={!value.script.on}
          onChange={(event) =>
            onChange({ ...value, script: { ...value.script, path: event.target.value } })
          }
        />
      </SetupLine>
      <Divider />
      <Note>
        Runs inside the new worktree before Claude starts. Detected from{" "}
        {detectedFrom.map((file, index) => (
          <span key={file}>
            {index > 0 && (index === detectedFrom.length - 1 ? " and " : ", ")}
            <span className="font-mono text-ink-3">{file}</span>
          </span>
        ))}
        .
      </Note>
    </>
  );
}

export function QuickCommandsEditor({
  value,
  onChange,
}: {
  value: readonly QuickCommand[];
  onChange: (value: QuickCommand[]) => void;
}) {
  const [name, setName] = useState("");
  const [command, setCommand] = useState("");
  const add = () => {
    if (!name.trim() || !command.trim()) return;
    onChange([...value, { name: name.trim(), command: command.trim(), on: true }]);
    setName("");
    setCommand("");
  };
  return (
    <>
      <div className="menu-scroll -mr-1.5 flex max-h-[272px] flex-col gap-1 overflow-y-auto pr-1.5">
        {value.map((item) => (
          <div key={item.name} className="flex h-8 shrink-0 items-center gap-3">
            <Switch
              size="sm"
              checked={item.on}
              onChange={(on) =>
                onChange(
                  value.map((entry) => (entry.name === item.name ? { ...entry, on } : entry)),
                )
              }
            />
            <span title={item.name} className="w-32 shrink-0 truncate font-mono text-xs text-ink">
              {item.name}
            </span>
            <span title={item.command} className="min-w-0 truncate font-mono text-2xs text-ink-4">
              {item.command}
            </span>
          </div>
        ))}
      </div>
      <Divider />
      <div className="flex items-center gap-2">
        <span className="w-[84px]">
          <Field
            aria-label="Name"
            placeholder="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </span>
        <span className="flex-1">
          <Field
            aria-label="Command"
            placeholder="command, e.g. docker compose up"
            value={command}
            onChange={(event) => setCommand(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && add()}
          />
        </span>
        <Button variant="quiet" size="sm" onClick={add}>
          Add
        </Button>
      </div>
      <Note>Shown as play buttons on every task card in this project.</Note>
    </>
  );
}

function TaskAddress({ address }: { address: string }) {
  const [head, tail] = address.split("{task}");
  return (
    <span className="flex h-6 items-center rounded-full px-2.5 font-mono text-2xs text-ink-2 shadow-[inset_0_0_0_1px_var(--line-strong)]">
      {head}
      {tail !== undefined && <span className="text-green">{"{task}"}</span>}
      {tail}
    </span>
  );
}

function GroupLabel({ label, source }: { label: string; source?: string }) {
  return (
    <div className="flex items-center pt-1 text-xs text-ink-3">
      {label}
      {source && <span className="ml-auto text-2xs text-ink-4">{source}</span>}
    </div>
  );
}

function ServiceMenu({ name }: { name: string }) {
  return (
    <IconButton aria-label={`${name} options`} size="sm" className="size-6">
      <Ellipsis width={13} height={13} strokeWidth={2} />
    </IconButton>
  );
}

export function EnvironmentEditor({
  value,
  onPrepareAgain,
}: {
  value: ProjectEnvironment;
  onPrepareAgain?: () => void;
}) {
  return (
    <>
      <GroupLabel label="In the browser" source="from package.json" />
      {value.browser.map((service, index) => (
        <div key={service.name} className="flex items-center gap-3">
          {index === 0 ? (
            <Globe width={13} height={13} strokeWidth={2} className="text-ink-4" />
          ) : (
            <Play width={13} height={13} strokeWidth={2} className="text-ink-4" />
          )}
          <span className="flex flex-1 flex-col">
            <span className="font-mono text-xs text-ink">
              {service.name} <span className="text-ink-4">:{service.port}</span>
            </span>
            <span className="font-mono text-3xs text-ink-4">{service.command}</span>
          </span>
          <TaskAddress address={service.address} />
          <ServiceMenu name={service.name} />
        </div>
      ))}
      <GroupLabel label="Inside the task only" source="from docker-compose.yml" />
      {value.internal.map((service) => (
        <div key={service.name} className="flex h-7 items-center gap-3">
          <Database width={13} height={13} strokeWidth={2} className="text-ink-4" />
          <span className="flex-1 font-mono text-xs text-ink">
            {service.name} <span className="text-ink-4">:{service.port}</span>
          </span>
          <span className="text-2xs text-ink-4">{service.note}</span>
          <ServiceMenu name={service.name} />
        </div>
      ))}
      <Button variant="quiet" size="xs" className="self-start">
        <Plus width={11} height={11} strokeWidth={2.25} />
        Add service
      </Button>
      <GroupLabel label="Per-task values" source="override .env inside each task" />
      {value.values.map((entry) => (
        <div
          key={entry.key}
          className="grid grid-cols-[150px_auto_minmax(0,1fr)] items-center gap-2"
        >
          <Field aria-label="Variable" defaultValue={entry.key} />
          <span className="text-xs text-ink-4">=</span>
          <Field aria-label="Value" defaultValue={entry.value} />
        </div>
      ))}
      <GroupLabel label="Clean base" />
      <div className="flex items-start gap-3 rounded-field bg-inset px-3.5 py-3 shadow-[inset_0_0_0_1px_var(--line)]">
        <StatusDot tone="green" className="mt-1.5" />
        <span className="flex flex-1 flex-col gap-1">
          <span className="text-sm font-medium text-ink">Ready</span>
          <span className="text-2xs text-ink-3">{value.cleanBase.detail}</span>
          <CheckList
            items={value.cleanBase.steps.map((label) => ({ label, state: "done" as const }))}
            className="mt-1 flex-row flex-wrap gap-x-4 [&_li]:py-0 [&_span]:text-2xs"
          />
        </span>
        <Button size="xs" onClick={onPrepareAgain}>
          Prepare again
        </Button>
      </div>
    </>
  );
}
