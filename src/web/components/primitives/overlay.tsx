import type { ReactNode } from "react";

export function Overlay({
  offset,
  onClose,
  children,
}: {
  offset: number;
  onClose?: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="absolute inset-0 z-40 flex items-start justify-center"
      style={{ paddingTop: offset }}
    >
      <div
        aria-hidden
        onClick={onClose}
        className="enter-fade absolute inset-0 bg-scrim backdrop-blur-[3px]"
      />
      {children}
    </div>
  );
}
