export interface FenceInfo {
  language: string;
  file: string;
}

const FILE_ATTRIBUTE = /\b(?:title|file|filename|path)=(?:"([^"]+)"|'([^']+)'|(\S+))/;
const LANGUAGE_AND_FILE = /^([\w+#-]+):(\S+)$/;
const FILE_EXTENSION = /\.([A-Za-z0-9]+)$/;
const looksLikePath = (word: string) => word.includes("/") || FILE_EXTENSION.test(word);
const extensionOf = (file: string) => file.match(FILE_EXTENSION)?.[1].toLowerCase() ?? "";

export function fenceInfo(info: string | undefined): FenceInfo {
  const raw = (info ?? "").trim();
  const attribute = raw.match(FILE_ATTRIBUTE);
  const words = raw.replace(FILE_ATTRIBUTE, " ").trim().split(/\s+/).filter(Boolean);
  const [first = "", second = ""] = words;
  if (attribute) {
    const file = attribute[1] ?? attribute[2] ?? attribute[3] ?? "";
    return { language: first || extensionOf(file) || "text", file };
  }
  const joined = first.match(LANGUAGE_AND_FILE);
  if (joined && looksLikePath(joined[2])) return { language: joined[1], file: joined[2] };
  if (second && looksLikePath(second)) return { language: first, file: second };
  if (first && words.length === 1 && looksLikePath(first)) {
    return { language: extensionOf(first) || "text", file: first };
  }
  return { language: first || "text", file: "" };
}

const CALLOUT_LABEL_MAX = 24;
const ENDS_LIKE_LABEL = /[.:!]$/;
const COLON_AFTER = /^\s*:\s*/;

export function calloutLabel(label: string, after: string): { title: string; rest: string } | null {
  const title = label.trim();
  if (!title || title.length > CALLOUT_LABEL_MAX) return null;
  if (ENDS_LIKE_LABEL.test(title)) return { title, rest: after.trimStart() };
  if (COLON_AFTER.test(after)) return { title: `${title}:`, rest: after.replace(COLON_AFTER, "") };
  return null;
}
