interface TokenTileProps {
  name: string;
  usage: string;
  children: React.ReactNode;
}

function TokenTile({ name, usage, children }: TokenTileProps): React.JSX.Element {
  return (
    <div className="flex w-32 flex-col gap-1.5">
      {children}
      <span className="font-mono text-3xs text-ink select-text">{name}</span>
      <span className="text-3xs text-ink-3">{usage}</span>
    </div>
  );
}

export default TokenTile;
