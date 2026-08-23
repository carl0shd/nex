export function applyOrder<T extends { id: string; sortOrder: number }>(
  items: T[],
  orderedIds: string[]
): T[] {
  const orderMap = new Map(orderedIds.map((id, idx) => [id, idx]));
  return items
    .map((item) => {
      const sortOrder = orderMap.get(item.id);
      return sortOrder === undefined ? item : { ...item, sortOrder };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
