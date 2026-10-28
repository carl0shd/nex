import type { ComponentType, ReactNode } from "react";
import { NavArrowDown, NavArrowRight } from "iconoir-react";
import { LogoTile } from "@/components/atoms/logo-tile";
import { Shimmer } from "@/components/atoms/shimmer";
import { Spinner } from "@/components/atoms/spinner";
import { cn } from "@/lib/utils";

export type BlockIcon = ComponentType<{ width?: number; height?: number; strokeWidth?: number }>;
type Tone = "muted" | "green" | "red" | "orange" | "accent";

const ICON_TONE: Record<Tone, string> = {
  muted: "text-ink-3",
  green: "text-green",
  red: "text-red",
  orange: "text-orange",
  accent: "text-accent-ink",
};

const META_TONE: Record<Tone, string> = {
  muted: "text-ink-4",
  green: "text-green",
  red: "text-red",
  orange: "text-orange",
  accent: "text-accent-ink",
};

export function DiffCount({ added, removed }: { added?: number; removed?: number }) {
  return (
    <span className="shrink-0 font-mono text-2xs">
      {added !== undefined && <span className="text-green">+{added}</span>}{" "}
      {removed ? <span className="text-red">−{removed}</span> : null}
    </span>
  );
}

export function BlockTag({
  children,
  tone = "neutral",
  mono = false,
}: {
  children: ReactNode;
  tone?: "neutral" | "new";
  mono?: boolean;
}) {
  return (
    <span
      className={cn(
        "flex h-[18px] shrink-0 items-center gap-[5px] rounded-[5px] px-1.5",
        tone === "new" ? "bg-green-tint text-accent-ink" : "bg-hover text-ink-3",
        mono ? "font-mono text-3xs" : "text-2xs",
      )}
    >
      {children}
    </span>
  );
}

export function BlockRow({
  icon: Icon,
  lead,
  tone = "muted",
  verb,
  verbMuted = false,
  running = false,
  target,
  prose = false,
  aside,
  tags,
  diff,
  meta,
  metaTone = "muted",
  chevron,
  actions,
  onToggle,
}: {
  icon?: BlockIcon;
  lead?: ReactNode;
  tone?: Tone;
  verb: string;
  verbMuted?: boolean;
  running?: boolean;
  target?: ReactNode;
  prose?: boolean;
  aside?: ReactNode;
  tags?: ReactNode;
  diff?: { added?: number; removed?: number };
  meta?: ReactNode;
  metaTone?: Tone;
  chevron?: "right" | "down";
  actions?: ReactNode;
  onToggle?: () => void;
}) {
  const Chevron = chevron === "down" ? NavArrowDown : NavArrowRight;
  return (
    <div
      className={cn("flex h-[30px] min-w-0 items-center gap-[9px]", onToggle && "cursor-pointer")}
      onClick={onToggle}
    >
      {running ? (
        <Spinner />
      ) : (
        <span className={cn("flex w-3.5 shrink-0 justify-center", ICON_TONE[tone])}>
          {lead ?? (Icon && <Icon width={13} height={13} strokeWidth={2} />)}
        </span>
      )}
      {running ? (
        <Shimmer className="shrink-0 text-sm font-medium">{verb}</Shimmer>
      ) : (
        <span className={cn("shrink-0 text-sm font-medium", verbMuted ? "text-ink-3" : "text-ink")}>
          {verb}
        </span>
      )}
      {target && (
        <span
          className={cn(
            "truncate",
            prose ? "text-sm" : "font-mono text-xs",
            verbMuted ? "text-ink-4" : "text-ink-2",
          )}
        >
          {target}
        </span>
      )}
      {aside && <span className="truncate text-xs text-ink-4">{aside}</span>}
      {tags}
      {diff && <DiffCount {...diff} />}
      <span className={cn("ml-auto shrink-0 text-2xs whitespace-nowrap", META_TONE[metaTone])}>
        {meta}
      </span>
      {chevron && (
        <span className="flex shrink-0 text-ink-4">
          <Chevron width={12} height={12} strokeWidth={2} />
        </span>
      )}
      {actions && <span className="flex shrink-0">{actions}</span>}
    </div>
  );
}

export function BlockNote({ children, mono = false }: { children: ReactNode; mono?: boolean }) {
  return (
    <span
      className={cn(
        "-mt-1 ml-[23px] block",
        mono ? "font-mono text-2xs text-ink-4" : "text-xs text-ink-3",
      )}
    >
      {children}
    </span>
  );
}

export function BlockDetail({
  children,
  padding = "md",
  prose = false,
  className,
}: {
  children: ReactNode;
  padding?: "row" | "md" | "lines" | "image";
  prose?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-1 ml-[23px] rounded-control bg-inset text-ink-3 shadow-[inset_0_0_0_1px_var(--line-soft)]",
        prose ? "text-xs leading-[18px]" : "font-mono text-2xs leading-[18px]",
        padding === "row" && "px-3 py-1",
        padding === "md" && "px-3 py-2",
        padding === "lines" && "py-1.5 leading-[19px]",
        padding === "image" && "p-2.5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export type NumberedDiffLine = { n?: number; sign: "+" | "-" | " "; code: string };

export function DiffLines({
  lines,
  numbered = true,
}: {
  lines: NumberedDiffLine[];
  numbered?: boolean;
}) {
  return (
    <BlockDetail padding="lines">
      {lines.map((line, i) => (
        <div
          key={i}
          className={cn(
            "flex pr-2.5 text-ink",
            line.sign === "+" && "bg-green-tint/80",
            line.sign === "-" && "bg-red-tint/80",
          )}
        >
          {numbered && (
            <span className="w-[30px] shrink-0 pr-2 text-right text-ink-6">{line.n}</span>
          )}
          <span
            className={cn(
              "shrink-0",
              numbered ? "w-3.5" : "w-[18px] text-center",
              line.sign === "+" ? "text-green" : line.sign === "-" ? "text-red" : "text-ink-6",
            )}
          >
            {line.sign === " " ? "" : line.sign}
          </span>
          <span className="whitespace-pre">{line.code}</span>
        </div>
      ))}
    </BlockDetail>
  );
}

export type OutputLine = { text: string; tone?: "muted" | "ink" | "red" | "orange" };

const LINE_TONE = { muted: "", ink: "text-ink-2", red: "text-red", orange: "text-orange" };

export function OutputLines({ lines, more }: { lines: OutputLine[]; more?: { hidden: number } }) {
  return (
    <BlockDetail>
      {lines.map((line, i) => (
        <span key={i} className={cn("block whitespace-pre", LINE_TONE[line.tone ?? "muted"])}>
          {line.text}
        </span>
      ))}
      {more && (
        <div className="mt-1.5 flex gap-3.5 border-t border-line-soft pt-1.5 font-sans text-2xs">
          <button
            type="button"
            className="interactive press cursor-pointer text-ink-2 select-none hover:text-ink"
          >
            Show {more.hidden} more lines
          </button>
          <button
            type="button"
            className="interactive press cursor-pointer select-none hover:text-ink-2"
          >
            Open in terminal
          </button>
        </div>
      )}
    </BlockDetail>
  );
}

export function LiveOutput({ lines }: { lines: string[] }) {
  return (
    <BlockDetail>
      <div className="flex h-[54px] flex-col justify-end overflow-hidden [mask-image:linear-gradient(to_bottom,transparent_0,black_22px)]">
        {lines.map((line, i) => (
          <span key={i} className={cn("whitespace-pre", i === lines.length - 1 && "text-ink-2")}>
            {line}
            {i === lines.length - 1 && (
              <span className="caret-blink ml-[3px] inline-block h-[11px] w-1.5 translate-y-px bg-ink-3" />
            )}
          </span>
        ))}
      </div>
    </BlockDetail>
  );
}

export function FileList({ files }: { files: { path: string; meta: string }[] }) {
  return (
    <BlockDetail padding="row">
      {files.map((file) => (
        <div key={file.path} className="flex h-6 items-center gap-2">
          <span className="text-ink-2">{file.path}</span>
          <span className="ml-auto font-sans text-ink-4">{file.meta}</span>
        </div>
      ))}
    </BlockDetail>
  );
}

export function GrepMatches({
  term,
  matches,
}: {
  term: string;
  matches: { location: string; line: string }[];
}) {
  return (
    <BlockDetail className="px-3 py-1.5">
      {matches.map((match) => {
        const [before, ...rest] = match.line.split(term);
        return (
          <div key={match.location} className="flex h-[22px] items-center gap-2.5">
            <span className="w-[150px] shrink-0 text-ink-4">{match.location}</span>
            <span className="truncate whitespace-nowrap">
              {before}
              {rest.length > 0 && (
                <>
                  <span className="rounded-[3px] bg-accent-tint px-0.5 text-ink">{term}</span>
                  {rest.join(term)}
                </>
              )}
            </span>
          </div>
        );
      })}
    </BlockDetail>
  );
}

export function WebResults({
  results,
}: {
  results: { letter: string; title: string; domain: string }[];
}) {
  return (
    <BlockDetail padding="row" prose>
      {results.map((result) => (
        <div key={result.title} className="flex h-[26px] items-center gap-2">
          <LogoTile size="xs">{result.letter}</LogoTile>
          <span className="truncate text-xs text-ink-2">{result.title}</span>
          <span className="ml-auto shrink-0 text-2xs text-ink-4">{result.domain}</span>
        </div>
      ))}
    </BlockDetail>
  );
}

export function ImagePreview() {
  return (
    <BlockDetail padding="image">
      <div className="flex h-[136px] w-[220px] gap-2 rounded-chip bg-surface-raised p-2.5 shadow-[inset_0_0_0_1px_var(--line)]">
        <span className="w-9 rounded-[4px] bg-elevated" />
        <span className="flex flex-1 flex-col gap-1.5">
          <span className="h-2 w-3/5 rounded-[3px] bg-control-off" />
          <span className="flex-1 rounded-[4px] bg-elevated" />
          <span className="h-2 w-2/5 rounded-[3px] bg-control-off" />
        </span>
      </div>
    </BlockDetail>
  );
}
