import { getHelper, disposeHelper, type HelperMessage } from './helper-process';

export interface InputDevice {
  id: number;
  name: string;
  isDefault: boolean;
  isBuiltIn: boolean;
}

export interface Locale {
  identifier: string;
  displayName: string;
  supportsOnDevice: boolean;
}

export interface AvailabilityResult {
  available: boolean;
  reason?: string;
  authStatus?: string;
  micStatus?: string;
  recognizerLocale?: string;
  supportsOnDevice?: boolean;
}

export type SessionState = 'idle' | 'starting' | 'listening' | 'stopping' | 'stopped' | 'error';

export interface SessionResult {
  text: string;
  isFinal: boolean;
  confidence?: number;
  timestampMs?: number;
}

export interface SessionError {
  code: string;
  message: string;
}

export interface StartSessionOptions {
  locale?: string;
  deviceId?: number;
  interimResults?: boolean;
  continuous?: boolean;
  onDevice?: boolean;
}

type EventMsg = HelperMessage & {
  type: 'event';
  event: 'state' | 'result' | 'error' | 'stopped';
  state?: SessionState;
  text?: string;
  isFinal?: boolean;
  confidence?: number;
  timestampMs?: number;
  code?: string;
  message?: string;
};

export async function checkAvailability(): Promise<AvailabilityResult> {
  if (process.platform !== 'darwin') {
    return { available: false, reason: 'macOS only' };
  }
  const helper = getHelper();
  try {
    await helper.start();
  } catch (err) {
    return { available: false, reason: err instanceof Error ? err.message : String(err) };
  }
  const res = (await helper.send({ command: 'checkAvailability' }, 5000)) as HelperMessage & {
    available?: boolean;
    reason?: string;
    authStatus?: string;
    micStatus?: string;
    recognizerLocale?: string;
    supportsOnDevice?: boolean;
  };
  return {
    available: !!res.available,
    reason: res.reason,
    authStatus: res.authStatus,
    micStatus: res.micStatus,
    recognizerLocale: res.recognizerLocale,
    supportsOnDevice: res.supportsOnDevice
  };
}

export async function listInputDevices(): Promise<InputDevice[]> {
  if (process.platform !== 'darwin') return [];
  const helper = getHelper();
  await helper.start();
  const res = (await helper.send({ command: 'listDevices' }, 5000)) as HelperMessage & {
    devices?: InputDevice[];
  };
  return res.devices ?? [];
}

export async function listLocales(): Promise<Locale[]> {
  if (process.platform !== 'darwin') return [];
  const helper = getHelper();
  await helper.start();
  const res = (await helper.send({ command: 'listLocales' }, 5000)) as HelperMessage & {
    locales?: Locale[];
  };
  return res.locales ?? [];
}

export async function requestAuthorization(): Promise<{
  authorized: boolean;
  status: string;
}> {
  if (process.platform !== 'darwin') return { authorized: false, status: 'unsupported' };
  const helper = getHelper();
  await helper.start();
  const res = (await helper.send({ command: 'requestAuth' }, 30000)) as HelperMessage & {
    authorized?: boolean;
    status?: string;
  };
  return { authorized: !!res.authorized, status: res.status ?? 'unknown' };
}

interface ActiveSession {
  id: string;
  unsubscribe: () => void;
}

let active: ActiveSession | null = null;

export async function startSession(
  opts: StartSessionOptions,
  handlers: {
    onState?: (state: SessionState) => void;
    onResult?: (result: SessionResult) => void;
    onError?: (error: SessionError) => void;
    onEnd?: () => void;
  }
): Promise<void> {
  if (active) throw new Error('Speech session already running');
  const helper = getHelper();
  await helper.start();

  const id = helper.sendStreaming({
    command: 'startSession',
    locale: opts.locale ?? null,
    deviceId: opts.deviceId ?? null,
    interimResults: opts.interimResults ?? true,
    continuous: opts.continuous ?? false,
    onDevice: opts.onDevice ?? false
  });

  const channel = `event:${id}`;
  let ended = false;
  const cleanup = (): void => {
    if (ended) return;
    ended = true;
    helper.off(channel, listener);
    if (active?.id === id) active = null;
    handlers.onEnd?.();
  };
  const listener = (msg: EventMsg): void => {
    switch (msg.event) {
      case 'state':
        if (msg.state) handlers.onState?.(msg.state);
        break;
      case 'result':
        if (typeof msg.text === 'string' && typeof msg.isFinal === 'boolean') {
          handlers.onResult?.({
            text: msg.text,
            isFinal: msg.isFinal,
            confidence: msg.confidence,
            timestampMs: msg.timestampMs
          });
        }
        break;
      case 'error':
        handlers.onError?.({
          code: msg.code ?? 'unknown',
          message: msg.message ?? 'Unknown error'
        });
        cleanup();
        break;
      case 'stopped':
        cleanup();
        break;
    }
  };
  helper.on(channel, listener);

  active = { id, unsubscribe: cleanup };
}

export function stopSession(): void {
  if (!active) return;
  const id = active.id;
  // Allow the next session to start immediately; the listener stays subscribed
  // until the backend emits 'stopped' (500ms drain to flush trailing audio).
  active = null;
  getHelper().sendControl({ command: 'stopSession', sessionId: id });
}

export function abortSession(): void {
  if (!active) return;
  const id = active.id;
  active.unsubscribe();
  active = null;
  getHelper().sendControl({ command: 'abortSession', sessionId: id });
}

export function subscribeDevicesChanged(callback: () => void): () => void {
  const helper = getHelper();
  const listener = (): void => callback();
  helper.on('event:devices', listener);
  return () => helper.off('event:devices', listener);
}

export { disposeHelper };
