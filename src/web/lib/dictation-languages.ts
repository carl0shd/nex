import type { DictationLanguage } from "@/components/composer/dictation";

export const SUGGESTED_LANGUAGES = 4;

function capitalize(text: string): string {
  return text.charAt(0).toLocaleUpperCase() + text.slice(1);
}

export function toDictationLanguage(identifier: string): DictationLanguage {
  const id = identifier.replace(/_/g, "-");
  const [language, ...rest] = id.split("-");
  const region = rest.find((part) => /^([A-Z]{2}|\d{3})$/.test(part));
  try {
    const name = new Intl.DisplayNames([id], { type: "language" }).of(language) ?? language;
    const place = region ? new Intl.DisplayNames([id], { type: "region" }).of(region) : undefined;
    return { id, name: capitalize(name), region: place && capitalize(place) };
  } catch {
    return { id, name: id };
  }
}

export function suggestedLanguages(
  languages: readonly DictationLanguage[],
  recent: readonly string[],
  preferred: readonly string[],
): DictationLanguage[] {
  const byId = new Map(languages.map((language) => [language.id, language]));
  const ordered: DictationLanguage[] = [];
  const add = (language: DictationLanguage | undefined) => {
    if (language && !ordered.includes(language)) ordered.push(language);
  };
  recent.forEach((id) => add(byId.get(id)));
  for (const wanted of preferred) {
    add(byId.get(wanted) ?? languages.find((language) => language.id.startsWith(`${wanted}-`)));
  }
  return ordered.slice(0, SUGGESTED_LANGUAGES);
}
