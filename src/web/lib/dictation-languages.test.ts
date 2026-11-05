import { describe, expect, it } from "vite-plus/test";
import { suggestedLanguages, toDictationLanguage } from "@/lib/dictation-languages";

describe("toDictationLanguage", () => {
  it("names the language and region in that language", () => {
    expect(toDictationLanguage("es_419")).toEqual({
      id: "es-419",
      name: "Español",
      region: "Latinoamérica",
    });
  });
});

describe("suggestedLanguages", () => {
  it("puts recent picks first, then the system languages", () => {
    const languages = ["en-US", "es-419", "pt-BR", "fr-FR", "de-DE"].map(toDictationLanguage);
    const ids = suggestedLanguages(languages, ["pt-BR"], ["es", "en-US"]).map((item) => item.id);
    expect(ids).toEqual(["pt-BR", "es-419", "en-US"]);
  });
});
