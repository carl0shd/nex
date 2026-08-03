import { Info, AlertTriangle, AlertCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

type CalloutVariant = 'info' | 'warning' | 'error';

interface CalloutProps {
  variant?: CalloutVariant;
  icon?: LucideIcon;
  children: React.ReactNode;
}

const alertVariant = {
  info: 'default',
  warning: 'warning',
  error: 'destructive'
} as const;

const defaultIcon: Record<CalloutVariant, LucideIcon> = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle
};

function Callout({ variant = 'info', icon, children }: CalloutProps): React.JSX.Element {
  const Icon = icon ?? defaultIcon[variant];

  return (
    <Alert variant={alertVariant[variant]}>
      <Icon size={13} />
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}

export default Callout;
