import { useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { Checkbox } from "@/components/atoms/checkbox";
import { IconButton } from "@/components/atoms/icon-button";
import { Switch } from "@/components/atoms/switch";
import { TextField } from "@/components/atoms/text-field";
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

export function Field({ className, ...props }: React.ComponentProps<typeof TextField>) {
  return (
    <TextField
      mono
      size="md"
      className={cn("h-[30px] rounded-control text-xs", className)}
      {...props}
    />
  );
}

const ROW = "grid min-h-[30px] grid-cols-[180px_minmax(0,1fr)] items-center gap-2.5";

function FormRow({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className={ROW}>
      <span className="flex min-w-0 items-center gap-2.5 text-sm text-ink">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function Divider() {
  return <span className="h-px bg-line" />;
}

export function Note({ children }: { children: ReactNode }) {
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
      <FormRow label="Base branch">
        <SelectMenu
          value={value.base}
          options={branches.map((branch, index) => ({
            value: branch,
            label: index === 0 ? `${branch} · default` : branch,
          }))}
          onChange={(base) => onChange({ ...value, base })}
          className="w-full min-w-0"
        />
      </FormRow>
      <FormRow label="Prefix">
        <Field
          mono={false}
          aria-label="Prefix"
          value={value.prefix}
          onChange={(event) => onChange({ ...value, prefix: event.target.value })}
        />
      </FormRow>
      <div className={ROW}>
        <span />
        <Note>
          “Fix login redirect” becomes{" "}
          <span className="text-ink-2">{taskBranchName("Fix login redirect", prefix)}</span>
        </Note>
      </div>
      <Divider />
      <div className="flex items-center gap-3">
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex min-w-0 text-sm text-ink">
            <span className="shrink-0">Pull&nbsp;</span>
            <span title={value.base} className="truncate">
              {value.base}
            </span>
            <span className="shrink-0">&nbsp;before each new task</span>
          </span>
          <span className="text-2xs text-ink-4">So agents never start from a stale base.</span>
        </span>
        <Switch size="sm" checked={value.pull} onChange={(pull) => onChange({ ...value, pull })} />
      </div>
    </>
  );
}

export function FileChip({ name, onRemove }: { name: string; onRemove: () => void }) {
  return (
    <span className="flex h-6 max-w-[220px] items-center gap-1 rounded-chip pr-0.5 pl-2 text-2xs text-ink shadow-[inset_0_0_0_1px_var(--line-strong)]">
      <span title={name} className="truncate">
        {name}
      </span>
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
    <FormRow
      label={
        <>
          <Checkbox checked={checked} onChange={onCheck} label={label} />
          {label}
        </>
      }
    >
      {children}
    </FormRow>
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
          placeholder="pnpm install"
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
            className="h-[30px] w-28 rounded-control bg-transparent px-3 text-xs text-ink outline-none select-text placeholder:text-ink-3 focus:shadow-[inset_0_0_0_1px_var(--line-focus)]"
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
        Runs inside the new worktree before the agent starts.
        {detectedFrom.length > 0 && (
          <>
            {" "}
            Detected from{" "}
            {detectedFrom.map((file, index) => (
              <span key={file}>
                {index > 0 && (index === detectedFrom.length - 1 ? " and " : ", ")}
                <span className="text-ink-3">{file}</span>
              </span>
            ))}
            .
          </>
        )}
      </Note>
    </>
  );
}

const COMMAND_ROW = "grid grid-cols-[28px_128px_minmax(0,1fr)] items-center gap-2.5";

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
          <div key={item.name} className={cn(COMMAND_ROW, "h-8 shrink-0")}>
            <Switch
              size="sm"
              checked={item.on}
              onChange={(on) =>
                onChange(
                  value.map((entry) => (entry.name === item.name ? { ...entry, on } : entry)),
                )
              }
            />
            <span title={item.name} className="truncate text-sm text-ink">
              {item.name}
            </span>
            <span title={item.command} className="min-w-0 truncate font-mono text-2xs text-ink-4">
              {item.command}
            </span>
          </div>
        ))}
      </div>
      <Divider />
      <div className={cn(COMMAND_ROW, "grid-cols-[28px_128px_minmax(0,1fr)_auto]")}>
        <span />
        <Field
          mono={false}
          aria-label="Name"
          placeholder="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <span className="min-w-0">
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
