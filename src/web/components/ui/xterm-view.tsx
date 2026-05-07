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
import { getXtermSnapshot, setXtermSnapshot } from '@/lib/xterm-snapshot-cache';
import '@xterm/xterm/css/xterm.css';

interface XtermViewProps {
  terminalId: string;
  className?: string;
}

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

function loadRenderer(term: Terminal): ITerminalAddon {
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
    const canvas = new CanvasAddon();
    term.loadAddon(canvas);
    return canvas;
  }
}

function XtermView({ terminalId, className }: XtermViewProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let term: Terminal | null = null;
    let fitAddon: FitAddon | null = null;
    let serializeAddon: SerializeAddon | null = null;
    let rendererAddon: ITerminalAddon | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let unsubscribeData: (() => void) | null = null;
    let unsubscribeExit: (() => void) | null = null;
    let inputDisposable: { dispose(): void } | null = null;
    let resizeRaf: number | null = null;

    let writeQueue = '';
    let writeRaf: number | null = null;
    const flushWrites = (): void => {
      writeRaf = null;
      if (!term || !writeQueue) return;
      const data = writeQueue;
      writeQueue = '';
      term.write(data);
    };
    const queueWrite = (chunk: string): void => {
      writeQueue += chunk;
      if (writeRaf === null) writeRaf = requestAnimationFrame(flushWrites);
    };

    const theme = readTheme();

    term = new Terminal({
      fontFamily: '"JetBrains Mono Variable", "JetBrains Mono", ui-monospace, monospace',
      fontSize: 12,
      lineHeight: 1.3,
      cursorBlink: true,
      scrollback: 5000,
      allowProposedApi: true,
      theme: {
        background: theme.background,
        foreground: theme.foreground,
        cursor: theme.cursor,
        cursorAccent: theme.cursorAccent,
        selectionBackground: theme.selectionBackground
      }
    });

    fitAddon = new FitAddon();
    serializeAddon = new SerializeAddon();
    const unicode11 = new Unicode11Addon();

    term.loadAddon(fitAddon);
    term.loadAddon(serializeAddon);
    term.loadAddon(unicode11);
    term.loadAddon(new WebLinksAddon());
    term.loadAddon(new ClipboardAddon());
    term.loadAddon(new SearchAddon());

    term.unicode.activeVersion = '11';
    term.open(container);
    rendererAddon = loadRenderer(term);

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
      if (resizeRaf !== null) cancelAnimationFrame(resizeRaf);
      if (writeRaf !== null) cancelAnimationFrame(writeRaf);
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
        rendererAddon?.dispose();
      } catch {
        /* webgl dispose throws during fast unmount; swallow so term.dispose still runs */
      }
      try {
        term?.dispose();
      } catch {
        /* */
      }
    };
  }, [terminalId]);

  return (
    <div ref={containerRef} className={className ?? 'flex h-full w-full flex-col justify-end'} />
  );
}

export default XtermView;
