interface TokenRowProps {
  name: string;
  aside?: string;
  children: React.ReactNode;
}

function TokenRow({ name, aside, children }: TokenRowProps): React.JSX.Element {
  return (
    <div className="flex items-baseline gap-4">
      <span className="w-24 shrink-0 font-mono text-3xs text-ink-4 select-text">{name}</span>
      <div className="min-w-0 flex-1 truncate">{children}</div>
      {aside && <span className="shrink-0 text-3xs text-ink-3">{aside}</span>}
    </div>
  );
}

export default TokenRow;
