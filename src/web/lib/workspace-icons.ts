import {
  BookOpen,
  Bot,
  Briefcase,
  Building2,
  Code,
  Coffee,
  FlaskConical,
  Flame,
  Gamepad2,
  Globe,
  Heart,
  House,
  Leaf,
  Rocket,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { UpdateWorkspaceInput } from "@native/db/types";

export const WORKSPACE_ICONS = {
  briefcase: Briefcase,
  building: Building2,
  code: Code,
  bot: Bot,
  rocket: Rocket,
  sparkles: Sparkles,
  zap: Zap,
  flame: Flame,
  leaf: Leaf,
  globe: Globe,
  house: House,
  heart: Heart,
  coffee: Coffee,
  gamepad: Gamepad2,
  book: BookOpen,
  flask: FlaskConical,
} as const satisfies Record<string, LucideIcon>;

export type WorkspaceIconName = keyof typeof WORKSPACE_ICONS;

export const WORKSPACE_ICON_NAMES = Object.keys(WORKSPACE_ICONS) as WorkspaceIconName[];

export interface WorkspaceBadge {
  image: string | null;
  icon: WorkspaceIconName | null;
}

const ICON_PREFIX = "icon:";

function isIconName(name: string): name is WorkspaceIconName {
  return Object.hasOwn(WORKSPACE_ICONS, name);
}

export function workspaceIcon(stored: string | null | undefined): WorkspaceIconName | undefined {
  if (!stored?.startsWith(ICON_PREFIX)) return undefined;
  const name = stored.slice(ICON_PREFIX.length);
  return isIconName(name) ? name : undefined;
}

export function storedWorkspaceIcon(icon: WorkspaceIconName): string {
  return `${ICON_PREFIX}${icon}`;
}

export function badgeFields(
  customImage: string | null | undefined,
  icon: WorkspaceIconName | null | undefined,
): Pick<UpdateWorkspaceInput, "icon" | "customImage"> {
  if (icon) return { icon: storedWorkspaceIcon(icon), customImage: null };
  if (customImage === undefined && icon === undefined) return {};
  return { icon: customImage ? "image" : "letter", customImage: customImage || null };
}
