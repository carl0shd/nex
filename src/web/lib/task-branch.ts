const STOP_WORDS = new Set(["a", "an", "the", "to", "of", "for", "and", "in", "on", "with", "it"]);
const MAX_WORDS = 3;

export function taskSlug(title: string): string {
  const words = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((word) => word && !STOP_WORDS.has(word))
    .slice(0, MAX_WORDS);
  return words.length ? words.join("-") : "new-task";
}

export function uniqueSlug(slug: string, taken: ReadonlySet<string>): string {
  if (!taken.has(slug)) return slug;
  let suffix = 2;
  while (taken.has(`${slug}-${suffix}`)) suffix++;
  return `${slug}-${suffix}`;
}

export function withBranchPrefix(slug: string, prefix: string): string {
  const clean = prefix.replace(/\/+$/, "");
  return clean ? `${clean}/${slug}` : slug;
}

export function taskBranchName(title: string, prefix = "feat"): string {
  return withBranchPrefix(taskSlug(title), prefix);
}
