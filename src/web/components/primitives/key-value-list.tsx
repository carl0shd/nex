import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { IconButton } from "@/components/atoms/icon-button";
import { TextField } from "@/components/atoms/text-field";
import { cn } from "@/lib/utils";

type Row = { id: number; key: string; value: string };

let nextId = 0;
const toRows = (value: Readonly<Record<string, string>>): Row[] =>
  Object.entries(value).map(([key, item]) => ({ id: nextId++, key, value: item }));

const toRecord = (rows: readonly Row[]) =>
  Object.fromEntries(
    rows.filter((row) => row.key.trim()).map((row) => [row.key.trim(), row.value]),
  );

const sameRecord = (a: Readonly<Record<string, string>>, b: Readonly<Record<string, string>>) =>
  JSON.stringify(Object.entries(a)) === JSON.stringify(Object.entries(b));

function Cell(props: React.ComponentProps<typeof TextField>) {
  return <TextField mono size="md" className="h-[30px] rounded-control text-xs" {...props} />;
}

export function KeyValueList({
  value,
  onChange,
  keyLabel = "Name",
  valueLabel = "Value",
  addLabel = "Add",
  className,
}: {
  value: Readonly<Record<string, string>>;
  onChange: (value: Record<string, string>) => void;
  keyLabel?: string;
  valueLabel?: string;
  addLabel?: string;
  className?: string;
}) {
  const [rows, setRows] = useState(() => toRows(value));
  if (!sameRecord(toRecord(rows), value)) setRows(toRows(value));
  const update = (next: Row[]) => {
    setRows(next);
    onChange(toRecord(next));
  };
  const edit = (id: number, patch: Partial<Row>) =>
    update(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {rows.map((row) => (
        <div
          key={row.id}
          className="grid grid-cols-[150px_auto_minmax(0,1fr)_auto] items-center gap-2"
        >
          <Cell
            aria-label={keyLabel}
            placeholder={keyLabel}
            value={row.key}
            onChange={(event) => edit(row.id, { key: event.target.value })}
          />
          <span className="text-xs text-ink-4">=</span>
          <Cell
            aria-label={valueLabel}
            placeholder={valueLabel}
            value={row.value}
            onChange={(event) => edit(row.id, { value: event.target.value })}
          />
          <IconButton
            aria-label={`Remove ${row.key || "row"}`}
            size="sm"
            className="size-6"
            onClick={() => update(rows.filter((item) => item.id !== row.id))}
          >
            <X width={11} height={11} strokeWidth={2.25} />
          </IconButton>
        </div>
      ))}
      <Button
        variant="quiet"
        size="xs"
        className="self-start"
        onClick={() => setRows([...rows, { id: nextId++, key: "", value: "" }])}
      >
        <Plus width={11} height={11} strokeWidth={2.25} />
        {addLabel}
      </Button>
    </div>
  );
}
