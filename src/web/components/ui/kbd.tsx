interface KbdProps {
  children: React.ReactNode;
  className?: string;
}

function Kbd({ children, className = '' }: KbdProps): React.JSX.Element {
  return (
    <kbd
      className={`flex items-center justify-center select-none rounded border border-border-soft bg-bg-mute/50 px-1 py-0.5 text-center font-[system-ui] text-[10px] leading-none font-medium text-text-muted ${className}`}
    >
      {children}
    </kbd>
  );
}

export default Kbd;
