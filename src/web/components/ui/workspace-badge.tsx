import { Rocket, Code, Palette, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  rocket: Rocket,
  code: Code,
  palette: Palette,
  zap: Zap
};

interface WorkspaceBadgeProps {
  name: string;
  color: string;
  icon?: string;
  customImage?: string | null;
  size?: number;
  fontSize?: number;
  iconSize?: number;
  rounded?: string;
}

function WorkspaceBadge({
  name,
  color,
  icon = 'letter',
  customImage,
  size = 18,
  fontSize = 9,
  iconSize,
  rounded = 'rounded'
}: WorkspaceBadgeProps): React.JSX.Element {
  const isCustomImage = icon === 'custom' && !!customImage;
  const IconComponent = ICON_MAP[icon];
  const initial = name[0]?.toUpperCase() ?? '';
  const resolvedIconSize = iconSize ?? Math.round(size * 0.55);

  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden ${rounded} font-bold text-text`}
      style={{
        width: size,
        height: size,
        fontSize,
        ...(isCustomImage ? {} : { backgroundColor: color })
      }}
    >
      {isCustomImage ? (
        <img
          src={customImage!.startsWith('data:') ? customImage! : `nex-file://${customImage}`}
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
        />
      ) : IconComponent ? (
        <IconComponent size={resolvedIconSize} />
      ) : (
        initial
      )}
    </span>
  );
}

export default WorkspaceBadge;
export { ICON_MAP };
