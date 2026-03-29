import type { BadgeVariant } from '@/lib/status';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-badge-default-bg text-badge-default-text',
  success: 'bg-badge-success-bg text-badge-success-text',
  warning: 'bg-badge-warning-bg text-badge-warning-text',
  destructive: 'bg-badge-error-bg text-badge-error-text'
};

function Badge({ label, variant = 'default' }: BadgeProps): React.JSX.Element {
  return (
    <span
      className={`inline-flex select-none items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${variantStyles[variant]}`}
    >
      {label}
    </span>
  );
}

export default Badge;
