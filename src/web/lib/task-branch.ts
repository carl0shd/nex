const STOP_WORDS = new Set(["a", "an", "the", "to", "of", "for", "and", "in", "on", "with", "it"]);
const MAX_WORDS = 3;

export function taskBranchName(title: string, prefix = "feat"): string {
  const words = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((word) => word && !STOP_WORDS.has(word))
    .slice(0, MAX_WORDS);
  return words.length ? `${prefix}/${words.join("-")}` : `${prefix}/new-task`;
}
