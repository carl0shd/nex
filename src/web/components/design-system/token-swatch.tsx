interface TokenSwatchProps {
  name: string;
  variable: string;
  value: string;
}

function TokenSwatch({ name, variable, value }: TokenSwatchProps): React.JSX.Element {
  return (
    <div className="flex min-w-0 items-center gap-2.5" title={variable}>
      <span
        className="size-8 shrink-0 rounded-md border border-line-soft"
        style={{ background: `var(${variable})` }}
      />
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-mono text-2xs text-ink select-text">{name}</span>
        <span className="truncate font-mono text-3xs text-ink-3 select-text">{value}</span>
      </div>
    </div>
  );
}

export default TokenSwatch;
