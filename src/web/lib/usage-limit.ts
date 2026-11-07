const LIMIT_RESET = /resets?\s+(?:at\s+)?([^·.\n|()]+)/i;
const LIMIT_EPOCH = /\|(\d{10})\b/;
const CLOCK = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i;

export function limitResetAt(text: string, now: Date): Date | null {
  const epoch = text.match(LIMIT_EPOCH)?.[1];
  if (epoch) return new Date(Number(epoch) * 1000);
  const clock = text.match(LIMIT_RESET)?.[1].match(CLOCK);
  if (!clock) return null;
  const hour = (Number(clock[1]) % 12) + (clock[3].toLowerCase() === "pm" ? 12 : 0);
  const reset = new Date(now);
  reset.setHours(hour, Number(clock[2] ?? 0), 0, 0);
  if (reset <= now) reset.setDate(reset.getDate() + 1);
  return reset;
}

export function limitResetLabel(text: string, now: Date): string | undefined {
  const at = limitResetAt(text, now);
  if (at) return at.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return text.match(LIMIT_RESET)?.[1].trim();
}
