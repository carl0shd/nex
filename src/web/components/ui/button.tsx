interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'ghost' | 'destructive';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const variantStyles: Record<string, string> = {
  primary: 'bg-accent text-text hover:bg-accent-hover',
  ghost: 'border border-border-soft text-text-secondary hover:border-border hover:text-text',
  destructive: 'border border-destructive bg-destructive text-white hover:bg-destructive-hover'
};

function Button({
  children,
  variant = 'primary',
  onClick,
  disabled = false,
  className = ''
}: ButtonProps): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-md px-4 py-2 text-[13px] font-medium select-none ${variantStyles[variant]} ${disabled ? 'pointer-events-none opacity-40' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

export default Button;
