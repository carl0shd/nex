export const NEX_HOOK_MARKER = "# nex-hook";

interface HookCommand {
  type: string;
  command: string;
}

interface HookGroup {
  matcher?: string;
  hooks?: HookCommand[];
}

export type ClaudeSettings = Record<string, unknown> & { hooks?: Record<string, HookGroup[]> };

const isNex = (hook: HookCommand) => hook.command.includes(NEX_HOOK_MARKER);

export function hasNexHooks(settings: ClaudeSettings): boolean {
  return Object.values(settings.hooks ?? {}).some((groups) =>
    groups.some((group) => group.hooks?.some(isNex)),
  );
}

export function removeNexHooks(settings: ClaudeSettings): ClaudeSettings {
  if (!settings.hooks) return settings;
  const hooks: Record<string, HookGroup[]> = {};
  for (const [name, groups] of Object.entries(settings.hooks)) {
    const kept = groups
      .map((group) => ({ ...group, hooks: (group.hooks ?? []).filter((hook) => !isNex(hook)) }))
      .filter((group) => group.hooks.length > 0);
    if (kept.length > 0) hooks[name] = kept;
  }
  const { hooks: _hooks, ...rest } = settings;
  return Object.keys(hooks).length > 0 ? { ...rest, hooks } : rest;
}
