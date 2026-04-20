interface ChipProps {
  children: React.ReactNode;
}

function Chip({ children }: ChipProps): React.JSX.Element {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-[3px] bg-bg-raised px-1.5 py-0.5 text-[9px] font-medium text-text-muted">
      {children}
    </span>
  );
}

export default Chip;
