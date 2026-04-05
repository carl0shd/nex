import type { LucideIcon } from 'lucide-react';

interface ModalProps {
  children: React.ReactNode;
  width?: number;
  onClose?: () => void;
}

function Modal({ children, width = 440, onClose }: ModalProps): React.JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div
        className="relative flex flex-col gap-5 rounded-lg border border-border-strong bg-bg-panel p-6 shadow-2xl"
        style={{ width }}
      >
        {children}
      </div>
    </div>
  );
}

interface ModalHeaderProps {
  title?: string;
  subtitle?: string;
  label?: string;
  icon?: LucideIcon;
  align?: 'left' | 'center';
}

function ModalHeader({
  title,
  subtitle,
  label,
  icon: Icon,
  align = 'left'
}: ModalHeaderProps): React.JSX.Element {
  const textAlign = align === 'center' ? 'text-center' : '';

  return (
    <div className={`flex flex-col gap-1 ${textAlign}`}>
      {Icon && (
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full bg-bg-mute ${align === 'center' ? 'self-center' : ''}`}
        >
          <Icon size={20} className="text-text-secondary" />
        </div>
      )}
      {label && <span className="text-[11px] font-medium text-text-muted">{label}</span>}
      {title && <h2 className="text-lg font-semibold text-text">{title}</h2>}
      {subtitle && <p className="text-[13px] text-text-secondary">{subtitle}</p>}
    </div>
  );
}

function ModalBody({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <div className="flex flex-col">{children}</div>;
}

function ModalDivider(): React.JSX.Element {
  return <div className="h-px bg-border" />;
}

function ModalFooter({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <div className="flex items-center justify-end gap-2">{children}</div>;
}

interface ModalButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'ghost';
  onClick?: () => void;
  disabled?: boolean;
}

function ModalButton({
  children,
  variant = 'primary',
  onClick,
  disabled = false
}: ModalButtonProps): React.JSX.Element {
  const base =
    'flex cursor-pointer items-center justify-center gap-1.5 rounded-md px-4 py-2 text-[13px] font-medium select-none';
  const styles =
    variant === 'primary'
      ? 'bg-accent text-text hover:bg-accent-hover'
      : 'border border-border-strong text-text-secondary hover:text-text';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles} ${disabled ? 'pointer-events-none opacity-40' : ''}`}
    >
      {children}
    </button>
  );
}

export { Modal, ModalHeader, ModalBody, ModalDivider, ModalFooter, ModalButton };
