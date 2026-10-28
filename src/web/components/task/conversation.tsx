import type { ReactNode } from "react";
import { EditPencil, Eye, Terminal } from "iconoir-react";
import { Shimmer } from "@/components/atoms/shimmer";
import { Spinner } from "@/components/atoms/spinner";
import { BlockDetail, BlockRow, DiffLines, type NumberedDiffLine } from "@/components/task/blocks";

export function UserBubble({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-[460px] self-end rounded-[16px_16px_4px_16px] bg-elevated px-3.5 py-2.5 text-sm leading-[19px] text-ink">
      {children}
    </div>
  );
}

export function AgentText({ children }: { children: ReactNode }) {
  return <p className="m-0 text-sm text-ink-2">{children}</p>;
}

const TOOL_ICON = { read: Eye, edit: EditPencil, bash: Terminal } as const;

export type ToolKind = keyof typeof TOOL_ICON;

export function ToolRow({
  kind,
  verb,
  target,
  added,
  removed,
  meta,
  children,
}: {
  kind: ToolKind;
  verb: string;
  target: string;
  added?: number;
  removed?: number;
  meta?: string;
  children?: ReactNode;
}) {
  const hasDiff = added !== undefined || removed !== undefined;
  return (
    <div className="flex flex-col">
      <BlockRow
        icon={TOOL_ICON[kind]}
        verb={verb}
        target={target}
        diff={hasDiff ? { added, removed } : undefined}
        meta={meta}
      />
      {children}
    </div>
  );
}

export type DiffLine = Omit<NumberedDiffLine, "n">;

export function InlineDiff({ lines }: { lines: DiffLine[] }) {
  return <DiffLines lines={lines} numbered={false} />;
}

export function ToolOutput({ children }: { children: ReactNode }) {
  return <BlockDetail className="whitespace-pre-line">{children}</BlockDetail>;
}

export function WorkingLine({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-6 items-center gap-[9px]">
      <Spinner />
      <Shimmer className="text-sm">{children}</Shimmer>
    </div>
  );
}
