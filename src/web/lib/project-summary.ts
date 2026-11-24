export type Phrase = readonly { text: string; code?: boolean; name?: boolean }[];

export function listPhrase(items: readonly string[]): Phrase {
  return items.flatMap((item, index) => {
    const separator = index === 0 ? [] : [{ text: index === items.length - 1 ? " and " : ", " }];
    return [...separator, { text: item, name: true }];
  });
}

export interface WorktreeSetup {
  install: { on: boolean; command: string };
  copy: { on: boolean; files: readonly string[] };
  script: { on: boolean; path: string };
}

const ENV_FILES = "the env files its services read";

export function setupPhrase(setup: WorktreeSetup, copiesEnvFiles = false): Phrase {
  const parts: Phrase[] = [];
  if (setup.install.on && setup.install.command.trim())
    parts.push([{ text: "runs " }, { text: setup.install.command.trim(), code: true }]);
  const copied = setup.copy.on ? setup.copy.files : [];
  if (copied.length && copiesEnvFiles)
    parts.push([{ text: "copies " }, ...listPhrase(copied), { text: ` plus ${ENV_FILES}` }]);
  else if (copied.length) parts.push([{ text: "copies " }, ...listPhrase(copied)]);
  else if (copiesEnvFiles) parts.push([{ text: `copies ${ENV_FILES}` }]);
  if (setup.script.on && setup.script.path.trim())
    parts.push([{ text: "runs " }, { text: setup.script.path.trim(), code: true }]);
  if (parts.length === 0) return [{ text: "Worktrees start as a clean checkout" }];
  const joined = parts.flatMap((part, index) => [
    ...(index === 0 ? [] : [{ text: index === parts.length - 1 ? " and " : ", " }]),
    ...part,
  ]);
  return [{ text: "Each worktree " }, ...joined];
}

export function commandsPhrase(names: readonly string[]): Phrase {
  if (names.length === 0) return [{ text: "No quick commands on the cards" }];
  return [
    { text: names.length === 1 ? "Quick command " : "Quick commands " },
    ...listPhrase(names),
    { text: " on every card" },
  ];
}

export const phraseText = (phrase: Phrase) => phrase.map((part) => part.text).join("");
