import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import type { LucideIcon } from 'lucide-react';

interface ContextMenuAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  destructive?: boolean;
}

interface ContextMenuProps {
  trigger: React.ReactNode;
  actions: ContextMenuAction[];
}

function ContextMenu({ trigger, actions }: ContextMenuProps): React.JSX.Element {
  const groups: ContextMenuAction[][] = [];
  let current: ContextMenuAction[] = [];

  for (const action of actions) {
    if (action.destructive && current.length > 0) {
      groups.push(current);
      current = [];
    }
    current.push(action);
  }
  if (current.length > 0) groups.push(current);

  return (
    <Menu>
      <MenuButton as="div">{trigger}</MenuButton>
      <MenuItems
        portal
        anchor="bottom start"
        transition
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        className="z-50 flex w-45 cursor-default flex-col rounded-lg border border-border-menu bg-bg-menu p-1 shadow-lg transition-opacity duration-100 ease-out data-closed:opacity-0 [--anchor-gap:4px]"
      >
        {groups.map((group, gi) => (
          <div key={gi} className="flex flex-col">
            {gi > 0 && (
              <div className="py-1">
                <div className="h-px bg-border-soft" />
              </div>
            )}
            {group.map((action) => (
              <MenuItem key={action.label}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick();
                  }}
                  className={`flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 select-none data-[focus]:bg-bg-mute ${
                    action.destructive ? 'text-destructive-text' : 'text-text-secondary'
                  }`}
                >
                  <action.icon
                    size={13}
                    className={`shrink-0 ${action.destructive ? '' : 'text-text-muted'}`}
                  />
                  <span className="text-[12px]">{action.label}</span>
                </button>
              </MenuItem>
            ))}
          </div>
        ))}
      </MenuItems>
    </Menu>
  );
}

export default ContextMenu;
export type { ContextMenuAction };
