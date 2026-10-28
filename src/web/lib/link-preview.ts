export type LinkService =
  | "linear"
  | "github"
  | "figma"
  | "slack"
  | "notion"
  | "jira"
  | "sentry"
  | "web";

export interface LinkPreview {
  service: LinkService;
  label: string;
  mono: boolean;
}

const fromSlug = (slug: string) => decodeURIComponent(slug).replace(/-/g, " ").trim();

function describe(url: URL): LinkPreview | null {
  const host = url.hostname.replace(/^www\./, "");
  const parts = url.pathname.split("/").filter(Boolean);

  if (host === "linear.app" && parts[1] === "issue" && parts[2]) {
    return { service: "linear", label: parts[2], mono: true };
  }
  if (host === "github.com" && parts.length >= 4) {
    const [, repo, kind, ...rest] = parts;
    if (kind === "pull" || kind === "issues") {
      return { service: "github", label: `${repo}#${rest[0]}`, mono: true };
    }
    if (kind === "blob" && rest.length >= 2) {
      return { service: "github", label: rest[rest.length - 1], mono: true };
    }
  }
  if (host === "figma.com" && (parts[0] === "design" || parts[0] === "file") && parts[2]) {
    return { service: "figma", label: fromSlug(parts[2]), mono: false };
  }
  if (host.endsWith(".slack.com") && parts[0] === "archives") {
    return { service: "slack", label: `${host.split(".")[0]} · thread`, mono: false };
  }
  if (host === "notion.so" && parts.length) {
    const page = parts[parts.length - 1].replace(/-?[0-9a-f]{32}$/i, "");
    if (page) return { service: "notion", label: fromSlug(page), mono: false };
  }
  if (host.endsWith(".atlassian.net") && parts[0] === "browse" && parts[1]) {
    return { service: "jira", label: parts[1], mono: true };
  }
  if (host.endsWith(".sentry.io") && parts[0] === "issues" && parts[1]) {
    return { service: "sentry", label: `Sentry #${parts[1]}`, mono: true };
  }
  return null;
}

export function describeLink(raw: string): LinkPreview | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  return describe(url) ?? { service: "web", label: url.hostname.replace(/^www\./, ""), mono: true };
}
