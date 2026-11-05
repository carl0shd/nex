export const STRIP_PEEK_PX = 62;
export const STRIP_CARD_MAX = "--strip-card-max";

export function stripCardMaxWidth(min: number): string {
  return `max(${min}px, var(${STRIP_CARD_MAX}, 100vw))`;
}
