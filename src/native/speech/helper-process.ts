// Launches SpeechHelper.app via `/usr/bin/open` and talks to it over a
// localhost TCP socket using newline-delimited JSON. The .app bundle is
// required so macOS TCC attributes the mic/speech permission prompts to
// the helper's own Info.plist usage descriptions.

import { spawn, type ChildProcess } from 'child_process';
import * as net from 'net';
import * as path from 'path';
import * as fs from 'fs';
import { EventEmitter } from 'events';

export type HelperMessage =
  | { type: 'ready' }
  | { type: 'log'; level: 'debug' | 'info' | 'warn' | 'error'; message: string }
  | { type: 'result'; id: string; [key: string]: unknown }
  | { type: 'error'; id: string; code: string; message: string }
  | { type: 'event'; id: string; event: string; [key: string]: unknown };

interface PendingRequest {
  resolve: (value: HelperMessage) => void;
  reject: (reason: unknown) => void;
  timeout: ReturnType<typeof setTimeout>;
}

let cachedAppPath: string | null = null;

const APP_BUNDLE = 'Nex Speech.app';
const APP_EXEC = 'Nex Speech';

function findAppPath(): string {
  if (cachedAppPath) return cachedAppPath;
  const candidates: string[] = [];
  const resourcesPath = (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath;
  if (resourcesPath) {
    candidates.push(path.join(resourcesPath, APP_BUNDLE));
    candidates.push(
      path.join(resourcesPath, 'app.asar.unpacked', 'helpers', 'speech', 'bin', APP_BUNDLE)
    );
  }
  candidates.push(
    path.resolve(__dirname, '..', '..', '..', 'helpers', 'speech', 'bin', APP_BUNDLE)
  );
  candidates.push(path.resolve(process.cwd(), 'helpers', 'speech', 'bin', APP_BUNDLE));

  for (const c of candidates) {
    if (fs.existsSync(path.join(c, 'Contents', 'MacOS', APP_EXEC))) {
      cachedAppPath = c;
      return c;
    }
  }
  throw new Error(`${APP_BUNDLE} not found. Run: bash helpers/speech/scripts/build.sh`);
}

function getAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address();
      if (!addr || typeof addr === 'string') {
        srv.close(() => reject(new Error('Could not allocate port')));
        return;
      }
      const port = addr.port;
      srv.close((err) => (err ? reject(err) : resolve(port)));
    });
  });
}

function connectWithRetry(port: number, timeoutMs: number): Promise<net.Socket> {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = (): void => {
      const sock = net.createConnection({ host: '127.0.0.1', port });
      sock.once('connect', () => resolve(sock));
      sock.once('error', (err) => {
        sock.destroy();
        if (Date.now() - startedAt >= timeoutMs) reject(err);
        else setTimeout(attempt, 100);
      });
    };
    attempt();
  });
}

type LaunchMode = 'standard' | 'launchservices-fallback';

function getLaunchArgs(appPath: string, port: number, mode: LaunchMode): string[] {
  if (mode === 'launchservices-fallback') {
    return ['-W', '-a', appPath, '--args', '--port', String(port)];
  }
  return ['-n', appPath, '--args', '--port', String(port)];
}

export class HelperProcess extends EventEmitter {
  private launcher: ChildProcess | null = null;
  private socket: net.Socket | null = null;
  private pending = new Map<string, PendingRequest>();
  private buffer = '';
  private ready = false;
  private starting: Promise<void> | null = null;
  private idCounter = 0;
  private launchMode: LaunchMode = 'standard';

  isReady(): boolean {
    return this.ready;
  }

  async start(): Promise<void> {
    if (this.ready) return;
    if (this.starting) return this.starting;

    this.starting = (async () => {
      const appPath = findAppPath();
      try {
        await this.startWithMode(appPath, this.launchMode);
      } catch (err) {
        if (this.launchMode === 'standard') {
          this.emit('log', {
            level: 'warn',
            message: `SpeechHelper standard launch failed, retrying with LaunchServices fallback: ${
              err instanceof Error ? err.message : String(err)
            }`
          });
          this.launchMode = 'launchservices-fallback';
          await this.startWithMode(appPath, this.launchMode);
        } else {
          this.starting = null;
          throw err;
        }
      }
    })();

    return this.starting;
  }

  private async startWithMode(appPath: string, mode: LaunchMode): Promise<void> {
    const port = await getAvailablePort();

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const timeout = setTimeout(() => {
        if (settled) return;
        settled = true;
        this.removeListener('ready', onReady);
        reject(new Error('SpeechHelper did not become ready within 8s'));
      }, 8000);
      const onReady = (): void => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        this.ready = true;
        this.starting = null;
        resolve();
      };
      this.once('ready', onReady);

      this.launcher = spawn('/usr/bin/open', getLaunchArgs(appPath, port, mode), {
        stdio: ['ignore', 'ignore', 'pipe']
      });

      this.launcher.stderr?.setEncoding('utf8');
      this.launcher.stderr?.on('data', (chunk: string) => {
        for (const line of chunk.split('\n')) {
          const trimmed = line.trim();
          if (trimmed) this.emit('log', { level: 'debug', message: trimmed });
        }
      });
      this.launcher.once('error', (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        this.starting = null;
        reject(err);
      });
      this.launcher.once('exit', (code) => {
        if (settled || code === 0) return;
        settled = true;
        clearTimeout(timeout);
        this.starting = null;
        reject(new Error(`open exited with code ${code}`));
      });

      connectWithRetry(port, 8000)
        .then((sock) => this.attachSocket(sock))
        .catch((err) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          this.starting = null;
          reject(err);
        });
    });
  }

  private attachSocket(socket: net.Socket): void {
    this.socket = socket;
    socket.setEncoding('utf8');
    socket.on('data', (chunk: string) => {
      this.buffer += chunk;
      const lines = this.buffer.split('\n');
      this.buffer = lines.pop() ?? '';
      for (const line of lines) if (line.trim()) this.handleLine(line);
    });
    socket.once('close', () => {
      this.ready = false;
      this.socket = null;
      this.starting = null;
      // If connection died unexpectedly while we had pending work, switch to
      // the LaunchServices mode for the next start — this typically signals
      // a sandboxing / activation issue with the standard `open -n` path.
      if (this.pending.size > 0 && this.launchMode === 'standard') {
        this.launchMode = 'launchservices-fallback';
        this.emit('log', {
          level: 'warn',
          message:
            'SpeechHelper connection closed unexpectedly; switching future launches to LaunchServices fallback mode.'
        });
      }
      for (const [, req] of this.pending) {
        clearTimeout(req.timeout);
        req.reject(new Error('SpeechHelper connection closed'));
      }
      this.pending.clear();
      this.emit('exit');
    });
    socket.once('error', (err) => {
      this.emit('log', { level: 'error', message: `socket error: ${err.message}` });
    });
  }

  private handleLine(line: string): void {
    let msg: HelperMessage;
    try {
      msg = JSON.parse(line) as HelperMessage;
    } catch {
      return;
    }
    if (msg.type === 'ready') {
      this.emit('ready');
      return;
    }
    if (msg.type === 'log') {
      this.emit('log', msg);
      return;
    }
    if (msg.type === 'event' && 'id' in msg) {
      this.emit(`event:${msg.id}`, msg);
      return;
    }
    if ('id' in msg && msg.id) {
      const req = this.pending.get(msg.id);
      if (!req) return;
      clearTimeout(req.timeout);
      this.pending.delete(msg.id);
      if (msg.type === 'error') req.reject(msg);
      else req.resolve(msg);
    }
  }

  send(command: Record<string, unknown>, timeoutMs = 60000): Promise<HelperMessage> {
    return new Promise((resolve, reject) => {
      if (!this.ready || !this.socket) {
        reject(new Error('SpeechHelper is not running'));
        return;
      }
      const id = String(++this.idCounter);
      const payload = JSON.stringify({ ...command, id }) + '\n';
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`SpeechHelper command timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timeout });
      this.socket.write(payload);
    });
  }

  /** Same as send() but returns the id immediately for streaming sessions. */
  sendStreaming(command: Record<string, unknown>): string {
    if (!this.ready || !this.socket) throw new Error('SpeechHelper is not running');
    const id = String(++this.idCounter);
    this.socket.write(JSON.stringify({ ...command, id }) + '\n');
    return id;
  }

  /** Fire-and-forget control message (uses an existing session id). */
  sendControl(command: Record<string, unknown>): void {
    if (!this.ready || !this.socket) return;
    this.socket.write(JSON.stringify(command) + '\n');
  }

  async dispose(): Promise<void> {
    if (!this.socket) return;
    this.sendControl({ command: 'shutdown' });
    await new Promise<void>((resolve) => {
      const sock = this.socket;
      const t = setTimeout(() => {
        sock?.destroy();
        resolve();
      }, 2000);
      sock?.once('close', () => {
        clearTimeout(t);
        resolve();
      });
    });
    this.socket = null;
    this.ready = false;
  }
}

let instance: HelperProcess | null = null;
export function getHelper(): HelperProcess {
  if (!instance) instance = new HelperProcess();
  return instance;
}
export async function disposeHelper(): Promise<void> {
  if (instance) {
    await instance.dispose();
    instance = null;
  }
}
