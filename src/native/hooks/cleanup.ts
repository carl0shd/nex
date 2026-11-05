import { existsSync, readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import * as agentAccountRepo from "@native/db/repositories/agent-account.repo";
import { hasNexHooks, removeNexHooks, type ClaudeSettings } from "@native/hooks/settings";

// Earlier versions installed hooks into Claude's settings; agents now stream, so they are removed.
export function removeLegacyHooks(): void {
  const dirs = new Set([join(homedir(), ".claude")]);
  for (const account of agentAccountRepo.getAll()) dirs.add(account.configDir);
  for (const dir of dirs) {
    const path = join(dir, "settings.json");
    if (!existsSync(path)) continue;
    try {
      const settings = JSON.parse(readFileSync(path, "utf8")) as ClaudeSettings;
      if (hasNexHooks(settings)) {
        writeFileSync(path, `${JSON.stringify(removeNexHooks(settings), null, 2)}\n`);
      }
    } catch {
      /* unreadable settings stay as they are */
    }
  }
}
