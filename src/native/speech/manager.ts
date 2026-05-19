import { IPC } from '@native/ipc/channels';
import { getMainWindow } from '@native/main/app-window';
import * as client from './client';

function send(payload: object): void {
  const win = getMainWindow();
  if (!win || win.isDestroyed()) return;
  win.webContents.send(IPC.SPEECH_EVENT, payload);
}

export function initSpeech(): void {
  client.subscribeDevicesChanged(() => send({ type: 'devicesChanged' }));
}

export async function speechAvailable(): Promise<client.AvailabilityResult> {
  return client.checkAvailability();
}

export async function listSpeechDevices(): Promise<client.InputDevice[]> {
  return client.listInputDevices();
}

export async function listSpeechLocales(): Promise<client.Locale[]> {
  return client.listLocales();
}

export async function requestSpeechAuth(): Promise<{ authorized: boolean; status: string }> {
  return client.requestAuthorization();
}

export async function startSpeech(opts: {
  locale?: string;
  deviceId?: number;
  onDevice?: boolean;
  continuous?: boolean;
}): Promise<void> {
  await client.startSession(
    {
      locale: opts.locale,
      deviceId: opts.deviceId,
      onDevice: opts.onDevice,
      continuous: opts.continuous ?? true,
      interimResults: true
    },
    {
      onState: (state) => send({ type: 'state', state }),
      onResult: ({ text, isFinal, confidence, timestampMs }) =>
        send({ type: isFinal ? 'final' : 'partial', text, confidence, timestampMs }),
      onError: ({ code, message }) => send({ type: 'error', code, message }),
      onEnd: () => send({ type: 'end' })
    }
  );
}

export function stopSpeech(): void {
  client.stopSession();
}

export function cancelSpeech(): void {
  client.abortSession();
}

export async function disposeSpeech(): Promise<void> {
  await client.disposeHelper();
}
