import { Sparkles } from 'lucide-react';
import claudeLogo from '@/assets/images/claude-logo.svg';

interface AgentIconProps {
  slug: string | undefined;
  size?: number;
  className?: string;
}

const SLUG_TO_LOGO: Record<string, string> = {
  'claude-code': claudeLogo
};

function AgentIcon({ slug, size = 14, className }: AgentIconProps): React.JSX.Element {
  const logo = slug ? SLUG_TO_LOGO[slug] : undefined;
  if (logo) {
    return (
      <img
        src={logo}
        alt=""
        draggable={false}
        className={className}
        style={{ width: size, height: size }}
      />
    );
  }
  return <Sparkles size={size} className={className} />;
}

export default AgentIcon;
