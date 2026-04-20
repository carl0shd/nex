import type { BadgeVariant } from '@/lib/status';

type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-badge-default-bg text-badge-default-text',
  success: 'bg-badge-success-bg text-badge-success-text',
  warning: 'bg-badge-warning-bg text-badge-warning-text',
  destructive: 'bg-badge-error-bg text-badge-error-text'
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-px text-[9px] font-semibold',
  md: 'px-2 py-0.5 text-[11px] font-medium'
};

function Badge({ label, variant = 'default', size = 'md' }: BadgeProps): React.JSX.Element {
  return (
    <span
      className={`inline-flex select-none items-center rounded-full ${sizeStyles[size]} ${variantStyles[variant]}`}
    >
      {label}
    </span>
  );
}

export default Badge;
