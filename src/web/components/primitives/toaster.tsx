import type { CSSProperties } from "react";
import { Toaster as Sonner } from "sonner";

const WIDTH = { "--width": "340px" } as CSSProperties;

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      offset={20}
      gap={10}
      visibleToasts={3}
      style={WIDTH}
      toastOptions={{ unstyled: true }}
    />
  );
}
