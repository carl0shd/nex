import { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface ActionMenuAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  destructive?: boolean;
  iconClassName?: string;
}

interface ActionMenuProps {
  trigger: React.ReactNode;
  actions: ActionMenuAction[];
  /** Right-clicking anywhere in this element opens the menu at the pointer. */
  rowRef?: React.RefObject<HTMLElement | null>;
}

const MENU_WIDTH = 180;

function ActionMenu({ trigger, actions, rowRef }: ActionMenuProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const row = rowRef?.current;
    if (!row) return;
    const handler = (e: MouseEvent): void => {
      e.preventDefault();
      e.stopPropagation();
      setPos({ x: e.clientX, y: e.clientY });
      setOpen(true);
    };
    row.addEventListener('contextmenu', handler);
    return () => row.removeEventListener('contextmenu', handler);
  }, [rowRef]);

  const openFromTrigger = (e: React.MouseEvent): void => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setPos({ x: rect.left, y: rect.bottom + 4 });
    setOpen(true);
  };

  const openFromContext = (e: React.MouseEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    setPos({ x: e.clientX, y: e.clientY });
    setOpen(true);
  };

  const groups = useMemo(() => {
    const result: ActionMenuAction[][] = [];
    let current: ActionMenuAction[] = [];
    for (const action of actions) {
      if (action.destructive && current.length > 0) {
        result.push(current);
        current = [];
      }
      current.push(action);
    }
    if (current.length > 0) result.push(current);
    return result;
  }, [actions]);

  return (
    // Modal: keeps the menu the top-most dismissable layer, so clicking an item inside a
    // dialog (e.g. manage workspaces) doesn't dismiss the dialog underneath it.
    <DropdownMenu open={open} onOpenChange={setOpen} modal>
      <DropdownMenuTrigger asChild>
        <span
          aria-hidden
          className="pointer-events-none fixed"
          style={{ left: pos.x, top: pos.y, width: 0, height: 0 }}
        />
      </DropdownMenuTrigger>
      <div onClick={openFromTrigger} onContextMenu={openFromContext} className="inline-flex">
        {trigger}
      </div>
      <DropdownMenuContent
        align="start"
        sideOffset={0}
        style={{ width: MENU_WIDTH }}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
        // The menu is portalled, but React events still bubble through the React tree, so a
        // click on an item would also fire the row's onClick (toggling the workspace/task).
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {groups.map((group, groupIndex) => (
          <div key={groupIndex} className="flex flex-col">
            {groupIndex > 0 && <DropdownMenuSeparator />}
            {group.map((action) => (
              <DropdownMenuItem
                key={action.label}
                variant={action.destructive ? 'destructive' : 'default'}
                onSelect={action.onClick}
              >
                <action.icon size={13} className={cn('shrink-0', action.iconClassName)} />
                {action.label}
              </DropdownMenuItem>
            ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ActionMenu;
export type { ActionMenuAction };
