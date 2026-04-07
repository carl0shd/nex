import { Dialog, DialogPanel, DialogBackdrop } from '@headlessui/react';
import type { LucideIcon } from 'lucide-react';

const PANEL_CLASS =
  'relative flex flex-col gap-5 rounded-lg border border-border-strong bg-bg-panel p-6 shadow-2xl';

interface ModalProps {
  children: React.ReactNode;
  width?: number;
  open?: boolean;
  onClose?: () => void;
  onAfterClose?: () => void;
}

function Modal({
  children,
  width = 440,
  open = true,
  onClose,
  onAfterClose
}: ModalProps): React.JSX.Element {
  const handleTransitionEnd = (): void => {
    if (!open && onAfterClose) onAfterClose();
  };

  return (
    <Dialog open={open} onClose={onClose ?? (() => {})} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/80 duration-150 ease-out data-closed:opacity-0"
        onTransitionEnd={handleTransitionEnd}
      />
      <div className="fixed inset-0 flex items-center justify-center">
        <DialogPanel
          transition
          className={`${PANEL_CLASS} duration-150 ease-out data-closed:scale-95 data-closed:opacity-0`}
          style={{ width }}
        >
          {children}
        </DialogPanel>
      </div>
    </Dialog>
  );
}

interface ModalPanelProps {
  children: React.ReactNode;
  width?: number;
  className?: string;
  style?: React.CSSProperties;
}

function ModalPanel({
  children,
  width = 440,
  className,
  style
}: ModalPanelProps): React.JSX.Element {
  return (
    <DialogPanel
      transition
      className={`${PANEL_CLASS} duration-200 ease-out data-closed:scale-95 data-closed:opacity-0 ${className ?? ''}`}
      style={{ width, ...style }}
    >
      {children}
    </DialogPanel>
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
  variant?: 'primary' | 'ghost' | 'destructive';
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

  const variantStyles: Record<string, string> = {
    primary: 'bg-accent text-text hover:bg-accent-hover',
    ghost: 'border border-border-strong text-text-secondary hover:text-text',
    destructive: 'bg-destructive text-white hover:bg-destructive-hover'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variantStyles[variant]} ${disabled ? 'pointer-events-none opacity-40' : ''}`}
    >
      {children}
    </button>
  );
}

export { Modal, ModalPanel, ModalHeader, ModalBody, ModalDivider, ModalFooter, ModalButton };
