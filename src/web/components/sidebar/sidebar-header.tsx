import {
  ChevronDown,
  LayoutGrid,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings
} from 'lucide-react';
import nexLogo from '@/assets/images/logo.svg';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import IconButton from '@/components/ui/icon-button';

interface SidebarHeaderProps {
  collapsed: boolean;
  onCollapse: () => void;
  onExpand: () => void;
  onNewWorkspace: () => void;
  onManageWorkspaces: () => void;
  onOpenSettings: () => void;
}

const FADE = 'transition-opacity duration-150';

function SidebarHeader({
  collapsed,
  onCollapse,
  onExpand,
  onNewWorkspace,
  onManageWorkspaces,
  onOpenSettings
}: SidebarHeaderProps): React.JSX.Element {
  return (
    <div className="relative mb-1 h-10 shrink-0">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-hidden={collapsed}
            tabIndex={collapsed ? -1 : 0}
            className={`sidebar-expanded-only interactive press absolute top-1 left-2 flex h-8 w-52 cursor-pointer items-center rounded-control px-2 text-left outline-none select-none hover:bg-hover-2 aria-expanded:bg-hover-2 ${FADE}`}
          >
            <span className="flex size-5 shrink-0 items-center justify-center">
              <img src={nexLogo} alt="" className="w-4" draggable={false} />
            </span>
            <span className="sidebar-copy ml-2 min-w-0 flex-1 truncate text-sm font-semibold text-ink">
              Nex
            </span>
            <ChevronDown size={14} className="sidebar-copy ml-1 shrink-0 text-ink-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-60">
          <DropdownMenuItem onSelect={onNewWorkspace}>
            <Plus size={13} />
            New workspace
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onManageWorkspaces}>
            <LayoutGrid size={13} />
            Manage workspaces
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onOpenSettings}>
            <Settings size={13} />
            Settings
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <IconButton
        icon={PanelLeftClose}
        size={16}
        title="Collapse sidebar"
        aria-hidden={collapsed}
        tabIndex={collapsed ? -1 : 0}
        onClick={onCollapse}
        className={`sidebar-expanded-only absolute top-1 right-2 size-8 ${FADE}`}
      />
      <IconButton
        icon={PanelLeftOpen}
        size={16}
        title="Expand sidebar"
        aria-hidden={!collapsed}
        tabIndex={collapsed ? 0 : -1}
        onClick={onExpand}
        className={`sidebar-collapsed-only absolute top-1 left-2.5 size-8 ${FADE}`}
      />
    </div>
  );
}

export default SidebarHeader;
