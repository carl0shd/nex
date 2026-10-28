export interface SearchableBlock {
  keywords: readonly string[];
}

export interface SearchableGroup<B extends SearchableBlock> {
  blocks: readonly B[];
}

export interface SearchableSection<B extends SearchableBlock, G extends SearchableGroup<B>> {
  title: string;
  groups: readonly G[];
}

const matches = (texts: readonly string[], needle: string) =>
  texts.some((text) => text.toLowerCase().includes(needle));

export function filterSections<
  B extends SearchableBlock,
  G extends SearchableGroup<B>,
  S extends SearchableSection<B, G>,
>(sections: readonly S[], query: string): S[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...sections];
  return sections.flatMap((section) => {
    if (matches([section.title], needle)) return [section];
    const groups = section.groups.flatMap((group) => {
      const blocks = group.blocks.filter((block) => matches(block.keywords, needle));
      return blocks.length ? [{ ...group, blocks }] : [];
    });
    return groups.length ? [{ ...section, groups }] : [];
  });
}
