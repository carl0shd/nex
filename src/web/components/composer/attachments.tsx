import type { ReactNode } from "react";
import { CursorPointer, Page, Text, Xmark } from "iconoir-react";
import { cn } from "@/lib/utils";

export type Attachment =
  | { id: string; kind: "image"; name: string; src?: string }
  | { id: string; kind: "text"; name: string; lines: number; language?: string }
  | { id: string; kind: "file"; name: string; size: string }
  | { id: string; kind: "element"; name: string; selector: string; page: string };

function Removable({ children, onRemove }: { children: ReactNode; onRemove?: () => void }) {
  return (
    <span className="relative flex">
      {children}
      {onRemove && (
        <button
          type="button"
          aria-label="Remove"
          onClick={onRemove}
          className="interactive press absolute -top-1 -right-1 flex size-4 cursor-pointer items-center justify-center rounded-full bg-ink-6 text-ink shadow-[0_0_0_2px_var(--surface-raised)] select-none hover:bg-ink-5"
        >
          <Xmark width={8} height={8} strokeWidth={2.75} />
        </button>
      )}
    </span>
  );
}

function ScreenshotPlaceholder() {
  return (
    <span aria-hidden className="flex size-full gap-[3px] p-1">
      <span className="w-1.5 rounded-[2px] bg-control-off" />
      <span className="flex flex-1 flex-col gap-[3px]">
        <span className="h-1 w-[70%] rounded-[2px] bg-accent/60" />
        <span className="flex-1 rounded-[3px] bg-control-off" />
      </span>
    </span>
  );
}

const IMAGE_SIZE = {
  tray: "size-10 rounded-control",
  drop: "size-11 rounded-field",
  sent: "h-[62px] w-[88px] rounded-field",
};

export function ImageThumb({
  name,
  src,
  size = "tray",
}: {
  name: string;
  src?: string;
  size?: keyof typeof IMAGE_SIZE;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 overflow-hidden bg-elevated shadow-[inset_0_0_0_1px_var(--line-strong)]",
        IMAGE_SIZE[size],
      )}
    >
      {src ? (
        <img src={src} alt={name} className="size-full object-cover" />
      ) : (
        <ScreenshotPlaceholder />
      )}
    </span>
  );
}

export function FileCard({
  name,
  meta,
  pasted = false,
}: {
  name: string;
  meta: string;
  pasted?: boolean;
}) {
  const Icon = pasted ? Text : Page;
  return (
    <span className="flex h-10 items-center gap-2 rounded-control bg-elevated pr-2.5 pl-1.5 shadow-[inset_0_0_0_1px_var(--line-strong)]">
      <span className="flex size-7 items-center justify-center rounded-chip bg-control-off text-ink-3">
        <Icon width={12} height={12} strokeWidth={2} />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-xs text-ink">{name}</span>
        <span className="text-2xs text-ink-4">{meta}</span>
      </span>
    </span>
  );
}

export function ElementCard({
  name,
  selector,
  page,
  onRemove,
}: {
  name: string;
  selector: string;
  page: string;
  onRemove?: () => void;
}) {
  return (
    <span className="flex h-8 items-center gap-2 rounded-control bg-elevated pr-1.5 pl-2 shadow-[inset_0_0_0_1px_var(--line-strong)]">
      <span className="flex size-5 items-center justify-center rounded-[5px] bg-blue/16 text-blue">
        <CursorPointer width={11} height={11} strokeWidth={2} />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-xs text-ink">{name}</span>
        <span className="font-mono text-3xs text-ink-4">
          {selector} · {page}
        </span>
      </span>
      {onRemove && (
        <button
          type="button"
          aria-label="Remove"
          onClick={onRemove}
          className="interactive press ml-1 flex size-5 cursor-pointer items-center justify-center rounded-[5px] text-ink-4 select-none hover:bg-hover hover:text-ink-2"
        >
          <Xmark width={10} height={10} strokeWidth={2.5} />
        </button>
      )}
    </span>
  );
}

function AttachmentView({ attachment, size }: { attachment: Attachment; size: "tray" | "sent" }) {
  if (attachment.kind === "image") {
    return <ImageThumb name={attachment.name} src={attachment.src} size={size} />;
  }
  if (attachment.kind === "element") {
    return (
      <ElementCard name={attachment.name} selector={attachment.selector} page={attachment.page} />
    );
  }
  if (attachment.kind === "text") {
    const meta = [`${attachment.lines} lines`, attachment.language].filter(Boolean).join(" · ");
    return <FileCard name={attachment.name} meta={meta} pasted />;
  }
  return <FileCard name={attachment.name} meta={attachment.size} />;
}

export function AttachmentTray({
  attachments,
  onRemove,
}: {
  attachments: readonly Attachment[];
  onRemove?: (id: string) => void;
}) {
  if (!attachments.length) return null;
  return (
    <div className="flex flex-wrap gap-2 px-2.5 pt-2.5">
      {attachments.map((attachment) =>
        attachment.kind === "element" ? (
          <ElementCard
            key={attachment.id}
            name={attachment.name}
            selector={attachment.selector}
            page={attachment.page}
            onRemove={onRemove ? () => onRemove(attachment.id) : undefined}
          />
        ) : (
          <Removable
            key={attachment.id}
            onRemove={onRemove ? () => onRemove(attachment.id) : undefined}
          >
            <AttachmentView attachment={attachment} size="tray" />
          </Removable>
        ),
      )}
    </div>
  );
}

export function SentAttachments({ attachments }: { attachments: readonly Attachment[] }) {
  return (
    <div className="flex flex-wrap justify-end gap-1.5 self-end">
      {attachments.map((attachment) => (
        <AttachmentView key={attachment.id} attachment={attachment} size="sent" />
      ))}
    </div>
  );
}
