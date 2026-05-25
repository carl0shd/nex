import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { LucideIcon } from 'lucide-react';

interface ContextMenuAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  destructive?: boolean;
  iconClassName?: string;
}

interface ContextMenuProps {
  trigger: React.ReactNode;
  actions: ContextMenuAction[];
  rowRef?: React.RefObject<HTMLElement | null>;
}

const MENU_WIDTH = 180;
const VIEWPORT_PADDING = 8;

function ContextMenu({ trigger, actions, rowRef }: ContextMenuProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent): void => {
      if (menuRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onContextMenu = (e: MouseEvent): void => {
      if (menuRef.current?.contains(e.target as Node)) return;
      if (rowRef?.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onScroll = (): void => setOpen(false);
    const t = window.setTimeout(() => {
      window.addEventListener('mousedown', onMouseDown);
      window.addEventListener('contextmenu', onContextMenu);
      window.addEventListener('keydown', onKey);
      window.addEventListener('scroll', onScroll, true);
    }, 0);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open, rowRef]);

  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!open || !el) return;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let x = pos.x;
    let y = pos.y;
    if (x + rect.width + VIEWPORT_PADDING > vw) x = vw - rect.width - VIEWPORT_PADDING;
    if (y + rect.height + VIEWPORT_PADDING > vh) y = vh - rect.height - VIEWPORT_PADDING;
    if (x < VIEWPORT_PADDING) x = VIEWPORT_PADDING;
    if (y < VIEWPORT_PADDING) y = VIEWPORT_PADDING;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
  }, [open, pos]);

  const openFromTrigger = (e: React.MouseEvent): void => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
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
    const result: ContextMenuAction[][] = [];
    let current: ContextMenuAction[] = [];
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
    <>
      <div onClick={openFromTrigger} onContextMenu={openFromContext} className="inline-flex">
        {trigger}
      </div>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: 'fixed', left: pos.x, top: pos.y, width: MENU_WIDTH, zIndex: 50 }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
            className="flex cursor-default flex-col rounded-lg border border-border-menu bg-bg-menu p-1 shadow-lg"
          >
            {groups.map((group, gi) => (
              <div key={gi} className="flex flex-col">
                {gi > 0 && (
                  <div className="py-1">
                    <div className="h-px bg-border-soft" />
                  </div>
                )}
                {group.map((action) => (
                  <button
                    key={action.label}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpen(false);
                      action.onClick();
                    }}
                    className={`flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 select-none hover:bg-bg-mute ${
                      action.destructive ? 'text-destructive-text' : 'text-text-secondary'
                    }`}
                  >
                    <action.icon
                      size={13}
                      className={`shrink-0 ${
                        action.iconClassName ?? (action.destructive ? '' : 'text-text-muted')
                      }`}
                    />
                    <span className="text-[12px]">{action.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}

export default ContextMenu;
export type { ContextMenuAction };
