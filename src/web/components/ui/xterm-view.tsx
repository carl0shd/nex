import { useEffect, useRef } from 'react';
import { Terminal, type ITerminalAddon } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { CanvasAddon } from '@xterm/addon-canvas';
import { WebglAddon } from '@xterm/addon-webgl';
import { Unicode11Addon } from '@xterm/addon-unicode11';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { ClipboardAddon } from '@xterm/addon-clipboard';
import { SearchAddon } from '@xterm/addon-search';
import { SerializeAddon } from '@xterm/addon-serialize';
import { useSessionStore } from '@/stores/session.store';
import { useLinkStore } from '@/stores/link.store';
import { getXtermSnapshot, setXtermSnapshot } from '@/lib/xterm-snapshot-cache';
import '@xterm/xterm/css/xterm.css';

interface XtermViewProps {
  terminalId: string;
  sessionId: string;
  onRedirectKey?: (char: string) => void;
  className?: string;
}

const UNFOCUSED_FLUSH_MS = 250;

type RendererKind = 'webgl' | 'canvas';

function readTheme(): Record<string, string> {
  const styles = getComputedStyle(document.documentElement);
  const get = (name: string): string => styles.getPropertyValue(name).trim();
  return {
    background: get('--nex-bg-chat'),
    foreground: get('--nex-text'),
    cursor: get('--nex-text'),
    cursorAccent: get('--nex-bg-chat'),
    selectionBackground: get('--nex-bg-item-active')
  };
}

function loadRenderer(term: Terminal, kind: RendererKind): ITerminalAddon | null {
  if (kind === 'webgl') {
    try {
      const webgl = new WebglAddon();
      let replaced = false;
      webgl.onContextLoss(() => {
        if (replaced) return;
        replaced = true;
        try {
          webgl.dispose();
        } catch {
          /* */
        }
        try {
          term.loadAddon(new CanvasAddon());
        } catch {
          /* */
        }
      });
      term.loadAddon(webgl);
      return webgl;
    } catch {
      /* fall through to canvas */
    }
  }
  try {
    const canvas = new CanvasAddon();
    term.loadAddon(canvas);
    return canvas;
  } catch {
    return null;
  }
}

function isPrintableKey(e: KeyboardEvent): boolean {
  if (e.ctrlKey || e.metaKey || e.altKey) return false;
  return e.key.length === 1;
}

function XtermView({
  terminalId,
  sessionId,
  onRedirectKey,
  className
}: XtermViewProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isFocused = useSessionStore((s) => s.activeSessionId === sessionId);
  const pendingFocusSessionId = useSessionStore((s) => s.pendingFocusSessionId);
  const onRedirectKeyRef = useRef(onRedirectKey);

  useEffect(() => {
    onRedirectKeyRef.current = onRedirectKey;
  }, [onRedirectKey]);

  useEffect(() => {
    if (pendingFocusSessionId !== sessionId) return;
    termRef.current?.focus();
    useSessionStore.getState().consumePendingFocus();
  }, [pendingFocusSessionId, sessionId]);

  const termRef = useRef<Terminal | null>(null);
  const rendererRef = useRef<ITerminalAddon | null>(null);
  const rendererKindRef = useRef<RendererKind | null>(null);
  const writeQueueRef = useRef('');
  const flushScheduleRef = useRef<{ kind: 'raf' | 'timeout'; handle: number } | null>(null);
  const isFocusedRef = useRef(isFocused);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let term: Terminal | null = null;
    let fitAddon: FitAddon | null = null;
    let serializeAddon: SerializeAddon | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let unsubscribeData: (() => void) | null = null;
    let unsubscribeExit: (() => void) | null = null;
    let inputDisposable: { dispose(): void } | null = null;
    let resizeRaf: number | null = null;

    const performFlush = (): void => {
      flushScheduleRef.current = null;
      const t = termRef.current;
      if (!t || !writeQueueRef.current) return;
      const data = writeQueueRef.current;
      writeQueueRef.current = '';
      t.write(data);
    };

    const scheduleFlush = (): void => {
      if (flushScheduleRef.current) return;
      if (isFocusedRef.current) {
        flushScheduleRef.current = { kind: 'raf', handle: requestAnimationFrame(performFlush) };
      } else {
        flushScheduleRef.current = {
          kind: 'timeout',
          handle: window.setTimeout(performFlush, UNFOCUSED_FLUSH_MS)
        };
      }
    };

    const cancelFlush = (): void => {
      const scheduled = flushScheduleRef.current;
      if (!scheduled) return;
      if (scheduled.kind === 'raf') cancelAnimationFrame(scheduled.handle);
      else clearTimeout(scheduled.handle);
      flushScheduleRef.current = null;
    };

    const queueWrite = (chunk: string): void => {
      writeQueueRef.current += chunk;
      scheduleFlush();
    };

    const theme = readTheme();

    term = new Terminal({
      fontFamily: '"JetBrains Mono Variable", "JetBrains Mono", ui-monospace, monospace',
      fontSize: 12,
      lineHeight: 1.3,
      cursorBlink: isFocusedRef.current,
      scrollback: 5000,
      allowProposedApi: true,
      linkHandler: {
        activate: (_event, uri) => {
          useLinkStore.getState().requestOpen(uri);
        }
      },
      theme: {
        background: theme.background,
        foreground: theme.foreground,
        cursor: theme.cursor,
        cursorAccent: theme.cursorAccent,
        selectionBackground: theme.selectionBackground
      }
    });
    // eslint-disable-next-line react-hooks/immutability
    termRef.current = term;

    fitAddon = new FitAddon();
    serializeAddon = new SerializeAddon();
    const unicode11 = new Unicode11Addon();

    term.loadAddon(fitAddon);
    term.loadAddon(serializeAddon);
    term.loadAddon(unicode11);
    term.loadAddon(
      new WebLinksAddon((_e, uri) => {
        useLinkStore.getState().requestOpen(uri);
      })
    );
    term.loadAddon(new ClipboardAddon());
    term.loadAddon(new SearchAddon());

    term.unicode.activeVersion = '11';
    term.open(container);

    term.attachCustomKeyEventHandler((e) => {
      if (e.type !== 'keydown') return true;
      const handler = onRedirectKeyRef.current;
      if (!handler) return true;
      if (!isPrintableKey(e)) return true;
      e.preventDefault();
      handler(e.key);
      return false;
    });

    const safeFit = (): void => {
      if (!term || !fitAddon) return;
      const rect = container.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      try {
        fitAddon.fit();
      } catch {
        /* */
      }
    };

    const setup = async (): Promise<void> => {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      if (cancelled || !term) return;

      safeFit();

      let preSnapshotBuffer = '';
      let snapshotWritten = false;

      unsubscribeData = window.api.onPtyData(terminalId, (data) => {
        if (snapshotWritten) queueWrite(data);
        else preSnapshotBuffer += data;
      });
      unsubscribeExit = window.api.onPtyExit(terminalId, () => {
        if (term) term.write('\r\n\x1b[2m[process exited]\x1b[0m\r\n');
      });

      const ensured = await window.api.ptyEnsure(terminalId, term.cols, term.rows);
      if (cancelled || !term) return;
      if (!ensured) return;

      const cached = getXtermSnapshot(terminalId);
      if (cached) {
        term.write(cached);
      } else {
        const snapshot = await window.api.ptyGetSnapshot(terminalId);
        if (cancelled || !term) return;
        if (snapshot?.data) term.write(snapshot.data);
      }

      if (preSnapshotBuffer) term.write(preSnapshotBuffer);
      snapshotWritten = true;

      safeFit();
      window.api.ptyResize(terminalId, term.cols, term.rows);

      inputDisposable = term.onData((data) => {
        window.api.ptyWrite(terminalId, data);
      });

      term.focus();
    };

    void setup();

    resizeObserver = new ResizeObserver(() => {
      if (resizeRaf !== null) return;
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = null;
        if (!term || !fitAddon) return;
        const before = { cols: term.cols, rows: term.rows };
        safeFit();
        if (term.cols !== before.cols || term.rows !== before.rows) {
          window.api.ptyResize(terminalId, term.cols, term.rows);
        }
      });
    });
    resizeObserver.observe(container);

    return () => {
      cancelled = true;
      cancelFlush();
      if (resizeRaf !== null) cancelAnimationFrame(resizeRaf);
      resizeObserver?.disconnect();
      unsubscribeData?.();
      unsubscribeExit?.();
      try {
        inputDisposable?.dispose();
      } catch {
        /* */
      }
      try {
        if (term && serializeAddon) {
          setXtermSnapshot(terminalId, serializeAddon.serialize());
        }
      } catch {
        /* falls back to main's raw buffer on next mount */
      }
      try {
        rendererRef.current?.dispose();
      } catch {
        /* webgl dispose throws during fast unmount; swallow so term.dispose still runs */
      }
      try {
        term?.dispose();
      } catch {
        /* */
      }

      termRef.current = null;
      rendererRef.current = null;
      rendererKindRef.current = null;
      writeQueueRef.current = '';
    };
  }, [terminalId]);

  useEffect(() => {
    isFocusedRef.current = isFocused;
    const term = termRef.current;
    if (!term) return;

    // eslint-disable-next-line react-hooks/immutability
    term.options.cursorBlink = isFocused;

    const desired: RendererKind = isFocused ? 'webgl' : 'canvas';
    if (rendererKindRef.current === desired) return;

    try {
      rendererRef.current?.dispose();
    } catch {
      /* */
    }
    rendererRef.current = loadRenderer(term, desired);
    rendererKindRef.current = desired;
  }, [isFocused]);

  return (
    <div ref={containerRef} className={className ?? 'flex h-full w-full flex-col justify-end'} />
  );
}

export default XtermView;
