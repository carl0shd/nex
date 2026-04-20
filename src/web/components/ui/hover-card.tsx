import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface HoverCardProps {
  children: React.ReactNode;
  content: React.ReactNode;
  delay?: number;
  gap?: number;
  disabled?: boolean;
  side?: 'right' | 'left';
}

function HoverCard({
  children,
  content,
  delay = 180,
  gap = 8,
  disabled = false,
  side = 'right'
}: HoverCardProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (disabled && open) setOpen(false);

  function handleEnter(): void {
    if (disabled) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const top = rect.top + rect.height / 2;
      const left = side === 'right' ? rect.right + gap : rect.left - gap;
      setPos({ top, left });
      setOpen(true);
    }, delay);
  }

  function handleLeave(): void {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(false);
  }

  return (
    <>
      <div ref={triggerRef} onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
        {children}
      </div>
      {open &&
        pos &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: pos.top,
              left: pos.left,
              transform: `translate(${side === 'right' ? '0' : '-100%'}, -50%)`
            }}
            className="pointer-events-none z-50"
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
}

export default HoverCard;
