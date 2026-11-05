import { useEffect, useRef, type Ref } from "react";
import {
  TerminalSurface,
  type TerminalHandle,
  type TerminalSize,
} from "@/components/terminal/terminal-surface";
import { takePrefill } from "@/lib/terminal-prefill";
import { keepTerminalSnapshot, takeTerminalSnapshot } from "@/lib/terminal-snapshots";

const PREFILL_DELAY_MS = 300;

export function PtyTerminal({
  terminalId,
  autoFocus,
  ref,
  className,
}: {
  terminalId: string;
  autoFocus?: boolean;
  ref?: Ref<TerminalHandle>;
  className?: string;
}) {
  const surfaceRef = useRef<TerminalHandle | null>(null);
  const disposeRef = useRef<(() => void) | null>(null);
  const connectedRef = useRef(false);

  useEffect(
    () => () => {
      disposeRef.current?.();
      const screen = surfaceRef.current?.serialize();
      if (connectedRef.current && screen) keepTerminalSnapshot(terminalId, screen);
    },
    [terminalId],
  );

  const connect = async (size: TerminalSize) => {
    const cached = takeTerminalSnapshot(terminalId);
    let live = cached !== null;
    const offData = window.api.onPtyData(terminalId, (data) => {
      if (live) surfaceRef.current?.write(data);
    });
    disposeRef.current = offData;
    if (cached !== null) {
      surfaceRef.current?.write(cached);
    } else {
      // Output that arrives before the snapshot is already inside it, so it is dropped.
      const snapshot = await window.api.ptyGetSnapshot(terminalId);
      if (snapshot?.data) surfaceRef.current?.write(snapshot.data);
      live = true;
    }
    connectedRef.current = true;
    await window.api.ptyEnsure(terminalId, size.cols, size.rows);
    const prefill = takePrefill(terminalId);
    if (prefill) setTimeout(() => window.api.ptyWrite(terminalId, prefill), PREFILL_DELAY_MS);
  };

  return (
    <TerminalSurface
      ref={(handle) => {
        if (handle) surfaceRef.current = handle;
        if (typeof ref === "function") ref(handle);
        else if (ref) ref.current = handle;
      }}
      autoFocus={autoFocus}
      onOpen={(size) => void connect(size)}
      onResize={({ cols, rows }) => window.api.ptyResize(terminalId, cols, rows)}
      onData={(data) => window.api.ptyWrite(terminalId, data)}
      className={className}
    />
  );
}
