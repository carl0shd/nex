import { Rocket, Code, Palette, Zap, ImagePlus } from 'lucide-react';
import type { IconSelectorOption } from '@/components/ui/icon-selector';

export function getWorkspaceIconOptions(initial: string): IconSelectorOption[] {
  return [
    { id: 'letter', type: 'letter', letter: initial },
    { id: 'rocket', type: 'icon', icon: Rocket },
    { id: 'code', type: 'icon', icon: Code },
    { id: 'palette', type: 'icon', icon: Palette },
    { id: 'zap', type: 'icon', icon: Zap },
    { id: 'custom', type: 'image-picker', icon: ImagePlus }
  ];
}
