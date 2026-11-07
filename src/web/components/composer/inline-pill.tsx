import type { ReactNode } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { FileIcon, Folder, Globe, TextIcon } from "lucide-react";
import figmaLogo from "@/assets/images/services/figma.webp";
import githubLogo from "@/assets/images/services/github.webp";
import jiraLogo from "@/assets/images/services/jira.webp";
import linearLogo from "@/assets/images/services/linear.webp";
import notionLogo from "@/assets/images/services/notion.webp";
import sentryLogo from "@/assets/images/services/sentry.webp";
import slackLogo from "@/assets/images/services/slack.webp";
import { toEntry } from "@/lib/composer-pickers";
import { describeLink, type LinkService } from "@/lib/link-preview";
import { cn } from "@/lib/utils";

export function InlinePill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "mx-px inline-flex h-[22px] items-center gap-[5px] rounded-chip bg-line-chip pr-[7px] pl-[5px] align-middle text-xs leading-none whitespace-nowrap text-ink shadow-[inset_0_0_0_1px_var(--line)]",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function FilePill({ path }: { path: string }) {
  const entry = toEntry(path);
  const Icon = entry.folder ? Folder : FileIcon;
  return (
    <InlinePill>
      <span className="flex text-ink-3">
        <Icon width={11} height={11} strokeWidth={2} />
      </span>
      <span className="text-xs">
        {entry.folder ? (
          path
        ) : (
          <>
            {entry.dir !== "." && <span className="text-ink-4">{entry.dir}/</span>}
            {entry.name}
          </>
        )}
      </span>
    </InlinePill>
  );
}

const SERVICE_LOGO: Record<Exclude<LinkService, "web">, string> = {
  linear: linearLogo,
  github: githubLogo,
  figma: figmaLogo,
  slack: slackLogo,
  notion: notionLogo,
  jira: jiraLogo,
  sentry: sentryLogo,
};

function LinkLogo({ service }: { service: LinkService }) {
  if (service === "web") {
    return (
      <span className="flex text-ink-3">
        <Globe width={12} height={12} strokeWidth={2} />
      </span>
    );
  }
  return (
    <img
      src={SERVICE_LOGO[service]}
      alt=""
      draggable={false}
      className="size-3.5 shrink-0 rounded-[4px]"
    />
  );
}

export function LinkPill({ url }: { url: string }) {
  const preview = describeLink(url);
  if (!preview) return <span>{url}</span>;
  return (
    <InlinePill>
      <LinkLogo service={preview.service} />
      <span className={cn(preview.mono && "font-mono text-2xs")}>{preview.label}</span>
    </InlinePill>
  );
}

export function LinkPillView({ node }: NodeViewProps) {
  return (
    <NodeViewWrapper as="span">
      <LinkPill url={String(node.attrs.url ?? "")} />
    </NodeViewWrapper>
  );
}

export function CommandPill({ name }: { name: string }) {
  return (
    <InlinePill className="pl-[7px]">
      <span className="text-xs text-accent-ink">/{name}</span>
    </InlinePill>
  );
}

export function PastedPill({ lines }: { lines: number }) {
  return (
    <InlinePill>
      <span className="flex text-ink-3">
        <TextIcon width={11} height={11} strokeWidth={2} />
      </span>
      <span className="text-xs">
        Pasted text <span className="text-ink-4">· {lines} lines</span>
      </span>
    </InlinePill>
  );
}
