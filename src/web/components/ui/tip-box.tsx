interface TipBoxProps {
  title?: string;
  children: React.ReactNode;
}

function TipBox({ title = '// tips & shortcuts', children }: TipBoxProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border-soft p-3">
      <span className="select-none text-[11px] font-medium text-text-muted">{title}</span>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

export default TipBox;
