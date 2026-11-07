import { Fragment, useMemo, useState } from "react";
import { Expand } from "@/components/atoms/expand";
import { FileCard } from "@/components/composer/attachments";
import { FilePill, LinkPill, PastedPill } from "@/components/composer/inline-pill";
import { UserBubble } from "@/components/task/conversation";
import { MessageImages } from "@/components/task/message-images";
import { relativePath } from "@/lib/tool-display";
import { parseUserMessage, type MessagePart, type PastedText } from "@/lib/user-message";

export type ImageNames = readonly (string | undefined)[];

function MessageParts({
  parts,
  cwd,
  onOpenUrl,
}: {
  parts: readonly MessagePart[];
  cwd: string;
  onOpenUrl?: (url: string) => void;
}) {
  return parts.map((part, index) => {
    if (part.kind === "text") return <Fragment key={index}>{part.text}</Fragment>;
    if (part.kind === "file") {
      return (
        <span key={index} title={part.path}>
          <FilePill path={relativePath(part.path, cwd)} />
        </span>
      );
    }
    if (!onOpenUrl) return <LinkPill key={index} url={part.url} />;
    return (
      <button
        key={index}
        type="button"
        title={part.url}
        onClick={() => onOpenUrl(part.url)}
        className="interactive press inline-flex cursor-pointer rounded-chip align-middle select-none hover:[&>span]:shadow-[inset_0_0_0_1px_var(--ink-5)]"
      >
        <LinkPill url={part.url} />
      </button>
    );
  });
}

function PastedTextCard({ content, lines }: PastedText) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex max-w-[460px] flex-col items-end gap-1.5 self-end">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="interactive press-wide flex cursor-pointer rounded-control select-none hover:[&>span]:shadow-[inset_0_0_0_1px_var(--ink-5)]"
      >
        <FileCard name="Pasted text" meta={`${lines} lines`} pasted />
      </button>
      <Expand open={open} className="w-full">
        <div className="quiet-scroll max-h-60 overflow-y-auto rounded-field bg-inset px-3 py-2.5 text-xs leading-[18px] break-words whitespace-pre-wrap text-ink-2 shadow-[inset_0_0_0_1px_var(--line)] select-text">
          {content}
        </div>
      </Expand>
    </div>
  );
}

export function UserMessage({
  text,
  images,
  cwd,
  onOpenImages,
  onOpenUrl,
}: {
  text: string;
  images?: readonly string[];
  cwd: string;
  onOpenImages?: (images: readonly string[], index: number, names: ImageNames) => void;
  onOpenUrl?: (url: string) => void;
}) {
  const message = useMemo(() => parseUserMessage(text), [text]);
  return (
    <div className="flex flex-col gap-2">
      {images?.length ? (
        <MessageImages
          images={images}
          names={message.imageNames}
          onOpen={(index) => onOpenImages?.(images, index, message.imageNames)}
        />
      ) : null}
      {message.pasted.map((pasted, index) => (
        <PastedTextCard key={index} content={pasted.content} lines={pasted.lines} />
      ))}
      {message.parts.length > 0 && (
        <UserBubble>
          <span className="whitespace-pre-wrap select-text">
            <MessageParts parts={message.parts} cwd={cwd} onOpenUrl={onOpenUrl} />
          </span>
        </UserBubble>
      )}
    </div>
  );
}

export function QueuedText({ text, cwd }: { text: string; cwd: string }) {
  const message = useMemo(() => parseUserMessage(text), [text]);
  return (
    <>
      <MessageParts parts={message.parts} cwd={cwd} />
      {message.pasted.map((pasted, index) => (
        <Fragment key={index}>
          {(message.parts.length > 0 || index > 0) && " "}
          <PastedPill lines={pasted.lines} />
        </Fragment>
      ))}
    </>
  );
}
