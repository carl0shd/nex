import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import { Terminal } from "@xterm/xterm";
import { CanvasAddon } from "@xterm/addon-canvas";
import { FitAddon } from "@xterm/addon-fit";
import { SerializeAddon } from "@xterm/addon-serialize";
import { Unicode11Addon } from "@xterm/addon-unicode11";
import { WebglAddon } from "@xterm/addon-webgl";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";
import { readCssToken, terminalTheme } from "@/lib/terminal-theme";
import { usePreferencesStore } from "@/stores/preferences.store";
import { cn } from "@/lib/utils";

export interface TerminalSize {
  cols: number;
  rows: number;
}

export interface TerminalHandle {
  write: (data: string) => void;
  clear: () => void;
  reset: () => void;
  focus: () => void;
  serialize: () => string;
}

const LINE_HEIGHT = 1.38;
const FONT_FAMILY = '"JetBrains Mono Variable", ui-monospace, "SF Mono", monospace';

function loadRenderer(term: Terminal) {
  const fallBack = () => {
    try {
      term.loadAddon(new CanvasAddon());
    } catch {
      /* xterm keeps its DOM renderer */
    }
  };
  try {
    const webgl = new WebglAddon();
    webgl.onContextLoss(() => {
      webgl.dispose();
      fallBack();
    });
    term.loadAddon(webgl);
  } catch {
    fallBack();
  }
}

function releaseWebgl(host: HTMLElement) {
  for (const canvas of host.querySelectorAll("canvas")) {
    const gl = canvas.getContext("webgl2");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  }
}

export function TerminalSurface({
  initialOutput,
  autoFocus = false,
  onData,
  onOpen,
  onResize,
  ref,
  className,
}: {
  initialOutput?: string;
  autoFocus?: boolean;
  onData?: (data: string) => void;
  onOpen?: (size: TerminalSize) => void;
  onResize?: (size: TerminalSize) => void;
  ref?: Ref<TerminalHandle>;
  className?: string;
}) {
  const cursor = usePreferencesStore((s) => s.prefs.cursor);
  const scrollback = Number(usePreferencesStore((s) => s.prefs.scrollback));
  const optionAsMeta = usePreferencesStore((s) => s.prefs.optionAsMeta);
  const fontSize = Number(usePreferencesStore((s) => s.prefs.codeFontSize));
  const copyOnSelect = usePreferencesStore((s) => s.prefs.copyOnSelect);
  const copyOnSelectRef = useRef(copyOnSelect);
  const hostRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const serializeRef = useRef<SerializeAddon | null>(null);
  const pendingRef = useRef("");
  const writeFrameRef = useRef(0);
  const initialOutputRef = useRef(initialOutput);
  const autoFocusRef = useRef(autoFocus);
  const onDataRef = useRef(onData);
  const onOpenRef = useRef(onOpen);
  const onResizeRef = useRef(onResize);
  useEffect(() => {
    onDataRef.current = onData;
    onOpenRef.current = onOpen;
    onResizeRef.current = onResize;
  });

  useImperativeHandle(ref, () => ({
    write: (data) => {
      pendingRef.current += data;
      if (writeFrameRef.current) return;
      writeFrameRef.current = requestAnimationFrame(() => {
        writeFrameRef.current = 0;
        termRef.current?.write(pendingRef.current);
        pendingRef.current = "";
      });
    },
    clear: () => termRef.current?.clear(),
    reset: () => termRef.current?.reset(),
    focus: () => termRef.current?.focus(),
    serialize: () => (serializeRef.current?.serialize() ?? "") + pendingRef.current,
  }));

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const initial = usePreferencesStore.getState().prefs;
    const term = new Terminal({
      fontFamily: FONT_FAMILY,
      fontSize: Number(initial.codeFontSize),
      lineHeight: LINE_HEIGHT,
      cursorBlink: true,
      cursorStyle: initial.cursor,
      scrollback: Number(initial.scrollback),
      macOptionIsMeta: initial.optionAsMeta,
      allowProposedApi: true,
      theme: terminalTheme(readCssToken),
    });
    const fit = new FitAddon();
    const serialize = new SerializeAddon();
    term.loadAddon(fit);
    term.loadAddon(serialize);
    term.loadAddon(new Unicode11Addon());
    term.unicode.activeVersion = "11";
    serializeRef.current = serialize;
    term.loadAddon(new WebLinksAddon((_event, uri) => window.open(uri)));
    termRef.current = term;

    let disposed = false;
    let frame = 0;
    const safeFit = () => {
      if (host.clientWidth < 2 || host.clientHeight < 2) return;
      fit.fit();
    };
    const resize = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(safeFit);
    });
    const retheme = new MutationObserver(() => {
      term.options.theme = terminalTheme(readCssToken);
    });
    term.attachCustomKeyEventHandler((event) => !event.metaKey);
    const typing = term.onData((data) => onDataRef.current?.(data));
    const selecting = term.onSelectionChange(() => {
      const selection = term.getSelection();
      if (copyOnSelectRef.current && selection) void navigator.clipboard.writeText(selection);
    });
    const resized = term.onResize((size) => onResizeRef.current?.(size));

    void document.fonts.ready.then(() => {
      if (disposed) return;
      term.open(host);
      loadRenderer(term);
      safeFit();
      if (initialOutputRef.current) term.write(initialOutputRef.current);
      onOpenRef.current?.({ cols: term.cols, rows: term.rows });
      if (autoFocusRef.current) term.focus();
      resize.observe(host);
      retheme.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(writeFrameRef.current);
      writeFrameRef.current = 0;
      pendingRef.current = "";
      typing.dispose();
      selecting.dispose();
      resized.dispose();
      resize.disconnect();
      retheme.disconnect();
      releaseWebgl(host);
      try {
        term.dispose();
      } catch {
        /* the webgl addon can throw while disposing during a fast unmount */
      }
      termRef.current = null;
      serializeRef.current = null;
    };
  }, []);

  useEffect(() => {
    copyOnSelectRef.current = copyOnSelect;
    const term = termRef.current;
    if (!term) return;
    term.options.cursorStyle = cursor;
    term.options.scrollback = scrollback;
    term.options.macOptionIsMeta = optionAsMeta;
    term.options.fontSize = fontSize;
  }, [cursor, scrollback, optionAsMeta, fontSize, copyOnSelect]);

  return <div ref={hostRef} className={cn("terminal-surface min-h-0", className)} />;
}
