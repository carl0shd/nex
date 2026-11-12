import { Plus, X } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { IconButton } from "@/components/atoms/icon-button";
import { TextField } from "@/components/atoms/text-field";
import { SelectMenu, type SelectOption } from "@/components/primitives/select-menu";
import { cn } from "@/lib/utils";

export interface CommandRow {
  target: string;
  command: string;
}

export function CommandRows({
  value,
  targets,
  onChange,
  placeholder,
  addLabel = "Add",
  className,
}: {
  value: readonly CommandRow[];
  targets: readonly SelectOption<string>[];
  onChange: (value: CommandRow[]) => void;
  placeholder?: string;
  addLabel?: string;
  className?: string;
}) {
  const edit = (index: number, patch: Partial<CommandRow>) =>
    onChange(value.map((row, at) => (at === index ? { ...row, ...patch } : row)));
  const first = targets[0]?.value;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {value.map((row, index) => (
        <div key={index} className="grid grid-cols-[132px_minmax(0,1fr)_auto] items-center gap-2">
          <SelectMenu
            value={row.target}
            options={
              targets.some((target) => target.value === row.target)
                ? targets
                : [{ value: row.target, label: row.target || "Pick one" }, ...targets]
            }
            onChange={(target) => edit(index, { target })}
            className="h-[30px] w-full min-w-0"
          />
          <TextField
            mono
            size="md"
            aria-label="Command"
            placeholder={placeholder}
            value={row.command}
            onChange={(event) => edit(index, { command: event.target.value })}
            className="h-[30px] rounded-control text-xs"
          />
          <IconButton
            aria-label={`Remove ${row.command || "step"}`}
            size="sm"
            className="size-6"
            onClick={() => onChange(value.filter((_, at) => at !== index))}
          >
            <X width={11} height={11} strokeWidth={2.25} />
          </IconButton>
        </div>
      ))}
      {first !== undefined && (
        <Button
          variant="quiet"
          size="xs"
          className="self-start"
          onClick={() => onChange([...value, { target: first, command: "" }])}
        >
          <Plus width={11} height={11} strokeWidth={2.25} />
          {addLabel}
        </Button>
      )}
    </div>
  );
}
