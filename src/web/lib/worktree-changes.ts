import { parsePatchFiles, type FileDiffMetadata } from "@pierre/diffs";
import type { ChangeStatus, ChangedFile } from "@/components/changes/diff-file";

const STATUS: Record<FileDiffMetadata["type"], ChangeStatus> = {
  change: "M",
  "rename-pure": "M",
  "rename-changed": "M",
  new: "A",
  deleted: "D",
};

export function contentHash(text: string): number {
  let hash = 5381;
  for (let index = 0; index < text.length; index++) {
    hash = ((hash << 5) + hash + text.charCodeAt(index)) | 0;
  }
  return hash >>> 0;
}

export function parseWorktreePatch(
  patch: string,
  previous: readonly ChangedFile[] = [],
): ChangedFile[] {
  if (!patch.trim()) return [];
  const known = new Map(previous.map((file) => [file.path, file]));
  const files = parsePatchFiles(patch).flatMap((parsed) => parsed.files);
  return files.map((diff) => {
    const version = contentHash(
      `${diff.type}\u0000${diff.additionLines.join("\n")}\u0000${diff.deletionLines.join("\n")}`,
    );
    const same = known.get(diff.name);
    if (same?.version === version) return same;
    return {
      path: diff.name,
      status: STATUS[diff.type],
      added: diff.hunks.reduce((sum, hunk) => sum + hunk.additionLines, 0),
      removed: diff.hunks.reduce((sum, hunk) => sum + hunk.deletionLines, 0),
      diff: { ...diff, cacheKey: `${diff.name}:${version}` },
      version,
    };
  });
}
