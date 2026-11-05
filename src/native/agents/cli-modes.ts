const CLI_MODE: Record<string, string> = {
  plan: "plan",
  manual: "manual",
  dontask: "dontAsk",
  edits: "acceptEdits",
  auto: "auto",
  bypass: "bypassPermissions",
};

export const cliMode = (mode: string) => CLI_MODE[mode] ?? "manual";

export const modeFromCli = (cli: string): string | null =>
  Object.entries(CLI_MODE).find(([, value]) => value === cli)?.[0] ??
  (cli === "default" ? "manual" : null);
