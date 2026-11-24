"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

type GlideMenuProps = {
  children: ReactNode;
  className?: string;
  highlightClassName?: string;
  rowSelector?: string;
  role?: string;
};

export default function GlideMenu({
  children,
  className = "",
  highlightClassName = "inset-x-0 rounded-control bg-hover",
  rowSelector = "[data-menu-row]",
  role,
}: GlideMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ top: number; height: number; row: HTMLElement } | null>(null);
  const [visible, setVisible] = useState(false);
  const highlightRef = useRef<HTMLSpanElement>(null);

  const moveTo = (target: EventTarget | null) => {
    const container = ref.current;
    if (!(target instanceof Element) || !container) return;
    const row = target.closest(rowSelector);
    if (!(row instanceof HTMLElement) || row.closest("[data-glide-menu]") !== container) return;
    const containerRect = container.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    const top = rowRect.top - containerRect.top;
    if (highlightRef.current) {
      highlightRef.current.style.top = `${top}px`;
      highlightRef.current.style.height = `${rowRect.height}px`;
    }
    setBox({ top, height: rowRect.height, row });
    setVisible(true);
  };

  useLayoutEffect(() => {
    const highlight = highlightRef.current;
    if (!highlight || !box || box.row.isConnected) return;
    highlight.style.top = "0px";
    highlight.style.height = "0px";
  }, [box, children]);

  return (
    <div
      ref={ref}
      role={role}
      data-glide-menu
      onMouseOver={(event) => moveTo(event.target)}
      onMouseLeave={() => setVisible(false)}
      onFocusCapture={(event) => moveTo(event.target)}
      onBlurCapture={(event) => {
        if (!ref.current?.contains(event.relatedTarget as Node | null)) setVisible(false);
      }}
      className={`group/glide-menu relative ${className}`}
    >
      <span
        ref={highlightRef}
        aria-hidden
        className={`pointer-events-none absolute ${highlightClassName}`}
        style={{
          top: box?.top ?? 0,
          height: box?.height ?? 0,
          opacity: box && visible ? 1 : 0,
          transition:
            "top 220ms cubic-bezier(0.23,1,0.32,1), height 220ms cubic-bezier(0.23,1,0.32,1), opacity 150ms ease",
        }}
      />
      {children}
    </div>
  );
}
