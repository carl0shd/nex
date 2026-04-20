import { Info, AlertTriangle, AlertCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type CalloutVariant = 'info' | 'warning' | 'error';

interface CalloutProps {
  variant?: CalloutVariant;
  icon?: LucideIcon;
  children: React.ReactNode;
}

const variantStyles: Record<CalloutVariant, string> = {
  info: 'border-border-soft bg-bg-raised text-text-secondary',
  warning: 'border-badge-warning-text/30 bg-badge-warning-bg/40 text-badge-warning-text',
  error: 'border-destructive/30 bg-destructive/10 text-destructive-text'
};

const defaultIcon: Record<CalloutVariant, LucideIcon> = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle
};

function Callout({ variant = 'info', icon, children }: CalloutProps): React.JSX.Element {
  const Icon = icon ?? defaultIcon[variant];
  return (
    <div
      className={`flex items-start gap-2 rounded-md border px-2.5 py-2 text-[11px] leading-relaxed ${variantStyles[variant]}`}
    >
      <Icon size={13} className="mt-0.5 shrink-0" />
      <div className="flex-1">{children}</div>
    </div>
  );
}

export default Callout;
