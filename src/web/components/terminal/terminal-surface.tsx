import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";
import { readCssToken, terminalTheme } from "@/lib/terminal-theme";
import { cn } from "@/lib/utils";

export interface TerminalHandle {
  write: (data: string) => void;
  clear: () => void;
  reset: () => void;
  focus: () => void;
}

const FONT_SIZE = 12;
const LINE_HEIGHT = 1.38;

export function TerminalSurface({
  initialOutput,
  onData,
  ref,
  className,
}: {
  initialOutput?: string;
  onData?: (data: string) => void;
  ref?: Ref<TerminalHandle>;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const initialOutputRef = useRef(initialOutput);
  const onDataRef = useRef(onData);
  useEffect(() => {
    onDataRef.current = onData;
  });

  useImperativeHandle(ref, () => ({
    write: (data) => termRef.current?.write(data),
    clear: () => termRef.current?.clear(),
    reset: () => termRef.current?.reset(),
    focus: () => termRef.current?.focus(),
  }));

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const term = new Terminal({
      fontFamily: '"JetBrains Mono Variable", ui-monospace, "SF Mono", monospace',
      fontSize: FONT_SIZE,
      lineHeight: LINE_HEIGHT,
      cursorBlink: true,
      cursorStyle: "block",
      scrollback: 5000,
      theme: terminalTheme(readCssToken),
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.loadAddon(new WebLinksAddon((_event, uri) => window.open(uri)));
    termRef.current = term;

    let disposed = false;
    let frame = 0;
    const resize = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => fit.fit());
    });
    const retheme = new MutationObserver(() => {
      term.options.theme = terminalTheme(readCssToken);
    });
    const typing = term.onData((data) => onDataRef.current?.(data));

    void document.fonts.ready.then(() => {
      if (disposed) return;
      term.open(host);
      fit.fit();
      if (initialOutputRef.current) term.write(initialOutputRef.current);
      resize.observe(host);
      retheme.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      typing.dispose();
      resize.disconnect();
      retheme.disconnect();
      term.dispose();
      termRef.current = null;
    };
  }, []);

  return <div ref={hostRef} className={cn("terminal-surface min-h-0", className)} />;
}
