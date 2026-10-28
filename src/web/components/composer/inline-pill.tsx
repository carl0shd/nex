import type { ReactNode } from "react";
import { Folder, Globe, Page } from "iconoir-react";
import { LogoTile } from "@/components/atoms/logo-tile";
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
  const Icon = entry.folder ? Folder : Page;
  return (
    <InlinePill>
      <span className="flex text-ink-3">
        <Icon width={11} height={11} strokeWidth={2} />
      </span>
      <span className="font-mono text-2xs">
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

const SERVICE_LOGO: Record<Exclude<LinkService, "web">, { letter: string; className: string }> = {
  linear: { letter: "L", className: "bg-brand-linear text-white" },
  github: { letter: "G", className: "bg-ink text-inverse" },
  figma: { letter: "F", className: "bg-brand-figma text-white" },
  slack: { letter: "S", className: "bg-brand-slack text-white" },
  notion: { letter: "N", className: "bg-ink text-inverse" },
  jira: { letter: "J", className: "bg-brand-jira text-white" },
  sentry: { letter: "S", className: "bg-brand-sentry text-white" },
};

function LinkLogo({ service }: { service: LinkService }) {
  if (service === "web") {
    return (
      <span className="flex text-ink-3">
        <Globe width={12} height={12} strokeWidth={2} />
      </span>
    );
  }
  const logo = SERVICE_LOGO[service];
  return (
    <LogoTile size="xs" className={logo.className}>
      {logo.letter}
    </LogoTile>
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

export function CommandPill({ name }: { name: string }) {
  return (
    <InlinePill className="pl-[7px]">
      <span className="font-mono text-2xs text-accent-ink">/{name}</span>
    </InlinePill>
  );
}
