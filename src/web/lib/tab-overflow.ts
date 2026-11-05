export interface TabFit {
  visible: number[];
  hidden: number[];
}

export function fitTabs({
  widths,
  active,
  available,
  gap,
  moreWidth,
}: {
  widths: readonly number[];
  active: number;
  available: number;
  gap: number;
  moreWidth: number;
}): TabFit {
  const all = widths.map((_, index) => index);
  const span = (indices: number[], more: boolean) =>
    indices.reduce((sum, index) => sum + widths[index] + gap, 0) + (more ? moreWidth + gap : 0);
  if (span(all, false) <= available) return { visible: all, hidden: [] };

  for (let count = widths.length - 1; count > 0; count--) {
    const visible = all.slice(0, count);
    if (active >= count) visible[count - 1] = active;
    if (span(visible, true) <= available) {
      return { visible, hidden: all.filter((index) => !visible.includes(index)) };
    }
  }
  const only = Math.max(0, active);
  return { visible: [only], hidden: all.filter((index) => index !== only) };
}
