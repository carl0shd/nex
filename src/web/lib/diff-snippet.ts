import type { DiffSnippet } from '@/stores/diff-chat.store';

/** Line ranges arrive unordered when the user drags upwards. */
export function normalizeRange(start: number, end: number): [number, number] {
  return start <= end ? [start, end] : [end, start];
}

export function sliceLines(contents: string, start: number, end: number): string {
  return contents
    .split('\n')
    .slice(start - 1, end)
    .join('\n');
}

export function composeAgentMessage(snippets: DiffSnippet[], text: string): string {
  if (snippets.length === 0) return text;

  const blocks = snippets.map((snippet) => {
    const label = `${snippet.file}:${snippet.start}-${snippet.end}`;
    const suffix = snippet.side === 'deletions' ? ' (removed)' : '';
    return `${label}${suffix}\n\`\`\`\n${snippet.code}\n\`\`\``;
  });

  return text ? `${blocks.join('\n\n')}\n\n${text}` : blocks.join('\n\n');
}
