import { useEffect, useRef } from 'react';
import SimpleBar from 'simplebar-react';
import type { LucideIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

/** Matches the panel exit animation in `dialog.tsx` so `onAfterClose` fires once it is hidden. */
const EXIT_DURATION = 150;

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
  const prevOpenRef = useRef(open);

  useEffect(() => {
    const wasOpen = prevOpenRef.current;
    prevOpenRef.current = open;
    if (!wasOpen || open) return;
    const timer = setTimeout(() => onAfterClose?.(), EXIT_DURATION);
    return () => clearTimeout(timer);
  }, [open, onAfterClose]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose?.();
      }}
    >
      <DialogContent showCloseButton={false} style={{ width }}>
        {children}
      </DialogContent>
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
    <DialogPanel showCloseButton={false} className={className} style={{ width, ...style }}>
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
  return (
    <DialogHeader className={cn(align === 'center' && 'text-center')}>
      {Icon && (
        <div
          className={cn(
            'flex size-12 items-center justify-center rounded-full bg-bg-mute',
            align === 'center' && 'self-center'
          )}
        >
          <Icon size={20} className="text-text-secondary" />
        </div>
      )}
      {label && <span className="text-[11px] font-medium text-text-muted">{label}</span>}
      <DialogTitle className={cn(!title && 'sr-only')}>{title ?? label ?? 'Dialog'}</DialogTitle>
      <DialogDescription className={cn(!subtitle && 'sr-only')}>
        {subtitle ?? title ?? ''}
      </DialogDescription>
    </DialogHeader>
  );
}

function ModalBody({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <SimpleBar autoHide={false} className="-mx-6" style={{ maxHeight: 'calc(100vh - 280px)' }}>
      <div className="flex flex-col gap-5 px-6">{children}</div>
    </SimpleBar>
  );
}

function ModalDivider(): React.JSX.Element {
  return <Separator />;
}

function ModalFooter({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <DialogFooter>{children}</DialogFooter>;
}

const ModalButton = Button;

export { Modal, ModalPanel, ModalHeader, ModalBody, ModalDivider, ModalFooter, ModalButton };
