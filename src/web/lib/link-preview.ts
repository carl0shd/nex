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

export type TextPart = { kind: "text"; text: string } | { kind: "link"; url: string };

const URL_IN_TEXT = /https?:\/\/[^\s<>"]+/g;
const TRAILING_PUNCTUATION = /[.,;:!?)\]'"]+$/;

export function splitLinks(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let cursor = 0;
  for (const match of text.matchAll(URL_IN_TEXT)) {
    const url = match[0].replace(TRAILING_PUNCTUATION, "");
    if (!describeLink(url)) continue;
    if (match.index > cursor) parts.push({ kind: "text", text: text.slice(cursor, match.index) });
    parts.push({ kind: "link", url });
    cursor = match.index + url.length;
  }
  if (cursor < text.length) parts.push({ kind: "text", text: text.slice(cursor) });
  return parts;
}
