const prefills = new Map<string, string>();

export function prefillTerminal(terminalId: string, text: string): void {
  prefills.set(terminalId, text);
}

export function takePrefill(terminalId: string): string | undefined {
  const text = prefills.get(terminalId);
  prefills.delete(terminalId);
  return text;
}
