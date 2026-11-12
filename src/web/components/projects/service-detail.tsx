import { useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import type { EnvBuild, EnvServiceDef, ProjectEnvironment } from "@native/db/types";
import { Button } from "@/components/atoms/button";
import { Spinner } from "@/components/atoms/spinner";
import { StatusDot } from "@/components/atoms/status-dot";
import { AnchoredPopover } from "@/components/primitives/anchored-popover";
import { Disclosure } from "@/components/primitives/disclosure";
import { KeyValueList } from "@/components/primitives/key-value-list";
import { Menu, MenuItem } from "@/components/primitives/menu";
import { SelectMenu } from "@/components/primitives/select-menu";
import { Field, FileChip, Note } from "@/components/projects/project-editors";
import {
  addressOf,
  advancedSummary,
  memoryOptions,
  mountsNote,
  parsePorts,
  TASK_PLACEHOLDER,
  type ServiceCheck,
} from "@/lib/project-environment";

function TaskAddress({ address }: { address: string }) {
  const [head, tail] = address.split(TASK_PLACEHOLDER);
  return (
    <span title={address} className="block truncate text-xs text-ink">
      {head}
      {tail !== undefined && <span className="text-green">{TASK_PLACEHOLDER}</span>}
      {tail}
    </span>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid min-h-[30px] grid-cols-[72px_minmax(0,1fr)] items-center gap-3">
      <span className="text-xs text-ink-3">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-xs font-medium text-ink-3">{label}</span>
      {children}
    </div>
  );
}

function PortsField({
  ports,
  onChange,
}: {
  ports: readonly number[];
  onChange: (ports: number[]) => void;
}) {
  const [text, setText] = useState(ports.join(", "));
  if (parsePorts(text).join() !== ports.join()) setText(ports.join(", "));
  return (
    <Field
      mono={false}
      label="Ports"
      placeholder="None, inside the task only"
      value={text}
      inputMode="numeric"
      onChange={(event) => {
        setText(event.target.value);
        onChange(parsePorts(event.target.value));
      }}
    />
  );
}

function StartsAfter({
  env,
  service,
  onChange,
}: {
  env: ProjectEnvironment;
  service: EnvServiceDef;
  onChange: (dependsOn: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const others = env.services
    .map((item) => item.name)
    .filter((name) => name && name !== service.name && !service.dependsOn.includes(name));
  if (others.length === 0 && service.dependsOn.length === 0) return null;
  return (
    <Labeled label="Starts after">
      <div className="flex flex-wrap items-center gap-1.5">
        {service.dependsOn.map((name) => (
          <FileChip
            key={name}
            name={name}
            onRemove={() => onChange(service.dependsOn.filter((item) => item !== name))}
          />
        ))}
        {others.length > 0 && (
          <AnchoredPopover
            open={open}
            onOpenChange={setOpen}
            side="bottom"
            strategy="fixed"
            trigger={
              <Button variant="quiet" size="xs" onClick={() => setOpen(!open)}>
                <Plus width={11} height={11} strokeWidth={2.25} />
                Add
              </Button>
            }
          >
            <Menu width={220} maxHeight={240}>
              {others.map((name) => (
                <MenuItem
                  key={name}
                  onSelect={() => {
                    onChange([...service.dependsOn, name]);
                    setOpen(false);
                  }}
                >
                  <span title={name} className="truncate">
                    {name}
                  </span>
                </MenuItem>
              ))}
            </Menu>
          </AnchoredPopover>
        )}
      </div>
    </Labeled>
  );
}

function ImageFields({
  service,
  onChange,
}: {
  service: EnvServiceDef;
  onChange: (patch: Partial<EnvServiceDef>) => void;
}) {
  const build =
    service.kind === "build" ? (service.build ?? { context: "", dockerfile: "" }) : null;
  const changeBuild = (patch: Partial<EnvBuild>) =>
    build && onChange({ build: { ...build, ...patch } });
  if (!build) {
    const app = service.kind === "app";
    return (
      <Field
        label={app ? "Runs on" : "Image"}
        placeholder={app ? "node:22-alpine" : "postgres:16-alpine"}
        value={service.image}
        onChange={(event) => onChange({ image: event.target.value.trim() })}
      />
    );
  }
  return (
    <>
      <Field
        mono={false}
        label="Dockerfile"
        placeholder="Dockerfile"
        value={build.dockerfile}
        onChange={(event) => changeBuild({ dockerfile: event.target.value.trim() })}
      />
      <Field
        mono={false}
        label="Folder"
        placeholder="The project folder"
        value={build.context}
        onChange={(event) => changeBuild({ context: event.target.value.trim() })}
      />
      <Field
        mono={false}
        label="Stage"
        placeholder="The last one"
        value={build.target ?? ""}
        onChange={(event) => changeBuild({ target: event.target.value.trim() || undefined })}
      />
    </>
  );
}

function Advanced({
  env,
  service,
  defaultOpen,
  onChange,
}: {
  env: ProjectEnvironment;
  service: EnvServiceDef;
  defaultOpen: boolean;
  onChange: (patch: Partial<EnvServiceDef>) => void;
}) {
  const mounts = mountsNote(service);
  return (
    <Disclosure label="Advanced" summary={advancedSummary(service)} defaultOpen={defaultOpen}>
      <div className="flex flex-col gap-3 pt-2 pb-1">
        <div className="grid grid-cols-2 gap-2.5">
          <Field
            mono={false}
            label="Name"
            value={service.name}
            onChange={(event) =>
              onChange({ name: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })
            }
          />
          <ImageFields service={service} onChange={onChange} />
          <PortsField ports={service.ports} onChange={(ports) => onChange({ ports })} />
        </div>
        <Labeled label="Variables">
          <KeyValueList
            value={service.env}
            onChange={(vars) => onChange({ env: vars })}
            keyLabel="Variable"
            addLabel="Add variable"
          />
          {service.envFiles && service.envFiles.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-2xs text-ink-4">Also reads</span>
              {service.envFiles.map((file) => (
                <FileChip
                  key={file}
                  name={file}
                  onRemove={() =>
                    onChange({ envFiles: service.envFiles?.filter((item) => item !== file) })
                  }
                />
              ))}
            </div>
          )}
        </Labeled>
        <StartsAfter
          env={env}
          service={service}
          onChange={(dependsOn) => onChange({ dependsOn })}
        />
        {mounts && <Note>{mounts}</Note>}
        {(service.data || service.seed) && (
          <Note>
            {service.data && `Keeps its data in ${service.data.path}.`}
            {service.data && service.seed && " "}
            {service.seed && `Seeds from ${service.seed.file}.`}
          </Note>
        )}
      </div>
    </Disclosure>
  );
}

export function ServiceDetail({
  env,
  service,
  check,
  opensInBrowser,
  defaultAdvanced = false,
  onChange,
  onRemove,
}: {
  env: ProjectEnvironment;
  service: EnvServiceDef;
  check: ServiceCheck | null;
  opensInBrowser: boolean;
  defaultAdvanced?: boolean;
  onChange: (patch: Partial<EnvServiceDef>) => void;
  onRemove: () => void;
}) {
  const address = opensInBrowser ? addressOf(env, service) : null;
  const failure = check?.tone === "red" ? check.detail : undefined;
  const app = service.kind === "app";
  return (
    <div className="mt-1 flex flex-col gap-2.5 rounded-field bg-hover px-3.5 py-3">
      {check && (
        <span
          title={failure ? undefined : check.detail}
          className="flex min-w-0 items-center gap-1.5 text-2xs text-ink-3"
        >
          {check.busy ? <Spinner className="size-3" /> : <StatusDot tone={check.tone} />}
          <span className="truncate">
            {check.label}
            {!failure && check.detail ? ` · ${check.detail}` : ""}
          </span>
        </span>
      )}
      {failure && (
        <p
          title={failure}
          className="m-0 line-clamp-3 min-w-0 text-2xs leading-4 [overflow-wrap:anywhere] text-red"
        >
          {failure}
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        {address && (
          <Row label="Opens at">
            <TaskAddress address={address} />
          </Row>
        )}
        <Row label="Command">
          <Field
            aria-label="Command"
            placeholder={app ? "pnpm install && pnpm dev" : "The image’s own command"}
            value={service.command ?? ""}
            onChange={(event) => onChange({ command: event.target.value || undefined })}
          />
        </Row>
        <Row label="Memory">
          <SelectMenu
            value={String(service.memoryMb)}
            options={memoryOptions(service.memoryMb)}
            onChange={(memory) => onChange({ memoryMb: Number(memory) })}
            className="h-[30px] w-[120px]"
          />
        </Row>
      </div>
      <Advanced env={env} service={service} defaultOpen={defaultAdvanced} onChange={onChange} />
      <Button variant="destructive" size="xs" className="-ml-1.5 self-start" onClick={onRemove}>
        <span title={service.name} className="max-w-[240px] truncate">
          Remove {service.name || "service"}
        </span>
      </Button>
    </div>
  );
}
