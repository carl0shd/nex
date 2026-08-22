/** Mirrors `repoNameFromUrl` in `@native/git/clone` — the renderer cannot import it at runtime. */
export function repoNameFromUrl(url: string): string {
  const cleaned = url
    .trim()
    .replace(/\/+$/, '')
    .replace(/\.git$/, '');
  return cleaned.split(/[/:]/).pop() ?? '';
}
