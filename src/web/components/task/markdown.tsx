import { useState, type ReactNode } from "react";
import { Check, Copy, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export function MdParagraph({ children }: { children: ReactNode }) {
  return <p className="m-0 text-sm text-ink-2">{children}</p>;
}

export function MdStrong({ children }: { children: ReactNode }) {
  return <b className="font-semibold text-ink">{children}</b>;
}

export function MdEm({ children }: { children: ReactNode }) {
  return <em className="text-ink-2 italic">{children}</em>;
}

export function MdDel({ children }: { children: ReactNode }) {
  return <del className="text-ink-4 decoration-ink-5">{children}</del>;
}

export function MdQuote({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 border-l-2 border-line-strong pl-3 text-ink-3 [&_p]:text-ink-3">
      {children}
    </div>
  );
}

export function MdLink({ href = "#", children }: { href?: string; children: ReactNode }) {
  return (
    <a
      href={href}
      title={href}
      onClick={(event) => {
        event.preventDefault();
        if (/^https?:/.test(href)) void window.api.openExternalUrl(href);
      }}
      className="interactive cursor-pointer border-b border-accent-ink/35 text-accent-ink no-underline hover:border-accent-ink"
    >
      {children}
    </a>
  );
}

export function MdHeading({ level, children }: { level: 2 | 3; children: ReactNode }) {
  return level === 2 ? (
    <h2 className="m-0 mt-1.5 text-lg font-semibold tracking-[-0.015em] text-ink">{children}</h2>
  ) : (
    <h3 className="m-0 mt-1 text-sm font-semibold text-ink">{children}</h3>
  );
}

export function MdList({ items, ordered = false }: { items: ReactNode[]; ordered?: boolean }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-1 p-0 text-sm text-ink-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span
            className={cn("w-4 shrink-0 text-ink-4", ordered && "font-mono text-2xs leading-5")}
          >
            {ordered ? `${i + 1}.` : "•"}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function MdCallout({
  title,
  children,
  blocks,
}: {
  title: string;
  children: ReactNode;
  blocks?: ReactNode;
}) {
  return (
    <div className="flex gap-3 rounded-field bg-orange-tint/60 px-3 py-2.5">
      <span className="flex pt-0.5 text-orange">
        <TriangleAlert width={14} height={14} strokeWidth={2} />
      </span>
      <div className="flex min-w-0 flex-col gap-2.5 text-sm text-ink-2">
        <span>
          <MdStrong>{title}</MdStrong> {children}
        </span>
        {blocks}
      </div>
    </div>
  );
}

export function MdDivider() {
  return <div className="my-1 h-px bg-line-chip" />;
}

export function MdTable({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  const template = { gridTemplateColumns: `1.2fr ${"1fr ".repeat(head.length - 1)}` };
  return (
    <div className="overflow-hidden rounded-field text-xs shadow-[inset_0_0_0_1px_var(--line-chip)]">
      <div className="grid bg-hover font-medium text-ink-3" style={template}>
        {head.map((cell) => (
          <span key={cell} className="px-3 py-2">
            {cell}
          </span>
        ))}
      </div>
      {rows.map((row, i) => (
        <div key={i} className="grid border-t border-line text-ink-2" style={template}>
          {row.map((cell, j) => (
            <span key={j} className={cn("px-3 py-2", j === 0 && "font-mono text-2xs text-ink")}>
              {cell}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

export type CodeToken = { text: string; kind?: "comment" | "keyword" | "string" | "number" };

const TOKEN = {
  comment: "text-ink-4",
  keyword: "text-blue",
  string: "text-accent-ink",
  number: "text-orange",
};

export function CodeBlock({
  file,
  language,
  lines,
}: {
  file: string;
  language: string;
  lines: CodeToken[][];
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="overflow-hidden rounded-field bg-inset shadow-[inset_0_0_0_1px_var(--line)]">
      <div className="flex h-8 items-center gap-2 border-b border-line pr-2 pl-3 text-2xs text-ink-4">
        {file && <span className="font-mono text-2xs text-ink-3">{file}</span>}
        <span>{language}</span>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(
              lines.map((tokens) => tokens.map((token) => token.text).join("")).join("\n"),
            );
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className={cn(
            "interactive press ml-auto flex h-[22px] cursor-pointer items-center gap-[5px] rounded-chip px-2 select-none",
            copied ? "bg-hover text-accent-ink" : "hover:bg-hover hover:text-ink-2",
          )}
        >
          {copied ? (
            <Check width={12} height={12} strokeWidth={2.5} />
          ) : (
            <Copy width={12} height={12} strokeWidth={2} />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="quiet-scroll overflow-x-auto py-2.5 pr-3 font-mono text-xs leading-5 text-ink">
        {lines.map((tokens, i) => (
          <div key={i} className="flex w-max min-w-full">
            <span className="w-7 shrink-0 pr-3 text-right text-ink-6">{i + 1}</span>
            <span className="whitespace-pre">
              {tokens.map((token, j) => (
                <span key={j} className={token.kind ? TOKEN[token.kind] : undefined}>
                  {token.text}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
