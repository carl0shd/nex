export type FileStatus = "M" | "A" | "D";

export interface WorktreeFile {
  path: string;
  status?: FileStatus;
  recent?: boolean;
}

export interface FileEntry {
  path: string;
  name: string;
  dir: string;
  folder: boolean;
  status?: FileStatus;
}

export type FilePickerView =
  | { mode: "suggested"; changed: FileEntry[]; recent: FileEntry[] }
  | { mode: "search"; matches: FileEntry[] }
  | { mode: "folder"; folder: string; entries: FileEntry[] };

export type CommandSource = "project" | "personal" | "builtin" | "skill";

export interface SlashCommand {
  name: string;
  args?: string;
  description: string;
  source: CommandSource;
}

export type CommandPickerView =
  | { mode: "suggested"; groups: { source: CommandSource; commands: SlashCommand[] }[] }
  | { mode: "search"; matches: SlashCommand[] };

const MAX_MATCHES = 8;
const SUGGESTED_SOURCES: CommandSource[] = ["project", "personal", "builtin"];

export function toEntry(path: string, status?: FileStatus): FileEntry {
  const folder = path.endsWith("/");
  const trimmed = folder ? path.slice(0, -1) : path;
  const slash = trimmed.lastIndexOf("/");
  return {
    path,
    name: trimmed.slice(slash + 1),
    dir: slash < 0 ? "." : trimmed.slice(0, slash),
    folder,
    status,
  };
}

function folderEntries(files: readonly WorktreeFile[], folder: string): FileEntry[] {
  const seen = new Map<string, FileEntry>();
  for (const file of files) {
    if (!file.path.startsWith(folder) || file.path === folder) continue;
    const rest = file.path.slice(folder.length);
    const slash = rest.indexOf("/");
    const child = slash < 0 || slash === rest.length - 1 ? rest : rest.slice(0, slash + 1);
    const path = folder + child;
    if (!seen.has(path))
      seen.set(path, toEntry(path, child.endsWith("/") ? undefined : file.status));
  }
  return [...seen.values()].sort((a, b) => Number(a.folder) - Number(b.folder));
}

function matchRank(entry: FileEntry, query: string): number {
  const name = entry.name.toLowerCase().indexOf(query);
  if (name === 0) return 0;
  if (name > 0) return 1;
  return entry.path.toLowerCase().includes(query) ? 2 : -1;
}

export function filePickerView(files: readonly WorktreeFile[], query: string): FilePickerView {
  if (query.endsWith("/")) {
    const entries = folderEntries(files, query);
    if (entries.length) return { mode: "folder", folder: query, entries };
  }
  if (!query) {
    return {
      mode: "suggested",
      changed: files.filter((file) => file.status).map((file) => toEntry(file.path, file.status)),
      recent: files.filter((file) => file.recent && !file.status).map((file) => toEntry(file.path)),
    };
  }
  const needle = query.toLowerCase();
  const familiarity = (file: WorktreeFile) => (file.status ? 0 : file.recent ? 1 : 2);
  const matches = files
    .map((file) => ({ file, entry: toEntry(file.path, file.status) }))
    .map(({ file, entry }) => ({ file, entry, rank: matchRank(entry, needle) }))
    .filter(({ rank }) => rank >= 0)
    .sort(
      (a, b) =>
        Math.min(a.rank, 1) - Math.min(b.rank, 1) ||
        familiarity(a.file) - familiarity(b.file) ||
        a.rank - b.rank ||
        a.entry.path.length - b.entry.path.length,
    )
    .slice(0, MAX_MATCHES)
    .map(({ entry }) => entry);
  return { mode: "search", matches };
}

export function filePickerEntries(view: FilePickerView): FileEntry[] {
  if (view.mode === "suggested") return [...view.changed, ...view.recent];
  return view.mode === "search" ? view.matches : view.entries;
}

function isSubsequence(text: string, needle: string): boolean {
  let index = 0;
  for (const char of text) if (char === needle[index]) index++;
  return index === needle.length;
}

function commandRank(name: string, needle: string): number {
  if (name.startsWith(needle)) return 0;
  if (name.includes(needle)) return 1;
  return isSubsequence(name, needle) ? 2 : -1;
}

export function commandPickerView(
  commands: readonly SlashCommand[],
  query: string,
): CommandPickerView {
  if (!query) {
    return {
      mode: "suggested",
      groups: SUGGESTED_SOURCES.map((source) => ({
        source,
        commands: commands.filter((command) => command.source === source),
      })).filter((group) => group.commands.length),
    };
  }
  const needle = query.toLowerCase();
  return {
    mode: "search",
    matches: commands
      .map((command) => ({ command, rank: commandRank(command.name.toLowerCase(), needle) }))
      .filter(({ rank }) => rank >= 0)
      .sort((a, b) => a.rank - b.rank)
      .slice(0, MAX_MATCHES)
      .map(({ command }) => command),
  };
}

export function commandPickerEntries(view: CommandPickerView): SlashCommand[] {
  return view.mode === "search" ? view.matches : view.groups.flatMap((group) => group.commands);
}
