import type { FoundRepo } from "@/components/projects/repo-picker";
import { notifyCompact } from "@/lib/notify";
import { foundRepo } from "@/lib/project-detect";

export async function repoAt(path: string): Promise<FoundRepo | null> {
  const inspection = await window.api.inspectRepo(path);
  if (!inspection.git) {
    notifyCompact({ tone: "orange", title: `${inspection.name} isn’t a git repo` });
    return null;
  }
  return foundRepo(inspection);
}
