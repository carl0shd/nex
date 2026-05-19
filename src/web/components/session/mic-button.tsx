import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, ChevronDown, Check } from 'lucide-react';
import SimpleBar from 'simplebar-react';
import Popover from '@/components/ui/popover';
import Toggle from '@/components/ui/toggle';
import { useMicStore } from '@/stores/mic.store';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';

interface MicDevice {
  id: number;
  name: string;
  isDefault: boolean;
  isBuiltIn: boolean;
}

interface SpeechLocale {
  identifier: string;
  displayName: string;
  supportsOnDevice: boolean;
}

interface MicButtonProps {
  onTranscript: (text: string) => void;
  onPartial?: (text: string) => void;
}

function MicButton({ onTranscript, onPartial }: MicButtonProps): React.JSX.Element {
  const holdToRecord = useMicStore((s) => s.holdToRecord);
  const setHoldToRecord = useMicStore((s) => s.setHoldToRecord);
  const selectedDeviceId = useMicStore((s) => s.selectedDeviceId);
  const setSelectedDevice = useMicStore((s) => s.setSelectedDevice);
  const selectedLocale = useMicStore((s) => s.selectedLocale);
  const setSelectedLocale = useMicStore((s) => s.setSelectedLocale);

  const [devices, setDevices] = useState<MicDevice[]>([]);
  const [locales, setLocales] = useState<SpeechLocale[]>([]);
  const { isRecording, start, stop } = useSpeechRecognition({
    locale: selectedLocale,
    deviceId: selectedDeviceId,
    onTranscript,
    onPartial
  });

  const loadDevices = useCallback(async (): Promise<void> => {
    const list = await window.api.speech.listDevices();
    setDevices(list);
  }, []);

  const loadLocales = useCallback(async (): Promise<void> => {
    const list = await window.api.speech.listLocales();
    setLocales(list);
  }, []);

  // Initial load + react to OS-pushed device changes (mic plug/unplug).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDevices();

    void loadLocales();
    const unsubscribe = window.api.speech.onEvent((event) => {
      if (event.type === 'devicesChanged') void loadDevices();
    });
    return unsubscribe;
  }, [loadDevices, loadLocales]);

  // In hold-to-record mode, a short tap (release < 300ms) acts like a toggle:
  // the session stays active until the next click. A long press behaves like
  // push-to-talk: recording stops when the user releases the mouse.
  const pressStartRef = useRef<number | null>(null);
  const HOLD_THRESHOLD_MS = 300;

  const handleClick = useCallback((): void => {
    if (holdToRecord) return;
    if (isRecording) stop();
    else void start();
  }, [holdToRecord, isRecording, start, stop]);

  const handlePointerDown = useCallback((): void => {
    if (!holdToRecord) return;
    if (isRecording) {
      stop();
      pressStartRef.current = null;
      return;
    }
    pressStartRef.current = Date.now();
    void start();
  }, [holdToRecord, isRecording, start, stop]);

  const handlePointerUp = useCallback((): void => {
    if (!holdToRecord) return;
    const startedAt = pressStartRef.current;
    pressStartRef.current = null;
    if (startedAt === null || !isRecording) return;
    if (Date.now() - startedAt >= HOLD_THRESHOLD_MS) stop();
  }, [holdToRecord, isRecording, stop]);

  return (
    <div
      className={`flex items-center rounded-md ${
        isRecording ? 'bg-badge-success-text/15' : 'hover:bg-bg-mute'
      }`}
    >
      <button
        type="button"
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={`flex cursor-pointer items-center rounded-l-md p-1.5 ${
          isRecording ? 'text-badge-success-text' : 'text-text-muted hover:text-text-secondary'
        }`}
      >
        <Mic size={14} />
      </button>
      <Popover
        anchor="top end"
        gap={6}
        trigger={
          <span
            onClick={() => void loadDevices()}
            className={`flex cursor-pointer items-center rounded-r-md py-1.5 pr-1 ${
              isRecording ? 'text-badge-success-text' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            <ChevronDown size={11} />
          </span>
        }
        className="w-72 rounded-lg border border-border-menu bg-bg-menu p-1.5 shadow-lg"
      >
        {({ close }) => (
          <div className="flex flex-col gap-1">
            <div className="px-2 pt-1 pb-0.5 text-[10px] uppercase tracking-wide text-text-muted select-none">
              Microphone
            </div>
            {devices.length === 0 && (
              <div className="px-2 py-1 text-[11px] text-text-muted select-none">
                No input devices
              </div>
            )}
            {devices.map((d) => {
              const isSelected =
                selectedDeviceId === d.id || (selectedDeviceId === null && d.isDefault);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setSelectedDevice(d.isDefault ? null : d.id);
                    close();
                  }}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-left text-text-secondary select-none hover:bg-bg-hover hover:text-text"
                >
                  <span className="flex-1 truncate text-[12px]">
                    {d.isDefault ? `Default - ${d.name}` : d.name}
                    {d.isBuiltIn && ' (Built-in)'}
                  </span>
                  {isSelected && <Check size={12} className="shrink-0 text-text" />}
                </button>
              );
            })}

            <div className="my-1 h-px bg-border-soft" />

            <div className="px-2 pt-1 pb-0.5 text-[10px] uppercase tracking-wide text-text-muted select-none">
              Language
            </div>
            <SimpleBar autoHide={false} style={{ maxHeight: 120 }}>
              <button
                type="button"
                onClick={() => {
                  setSelectedLocale(null);
                  close();
                }}
                className="flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1 text-left text-text-secondary select-none hover:bg-bg-hover hover:text-text"
              >
                <span className="flex-1 truncate text-[12px]">Auto (system)</span>
                {selectedLocale === null && <Check size={12} className="mr-1 shrink-0 text-text" />}
              </button>
              {locales.map((l) => (
                <button
                  key={l.identifier}
                  type="button"
                  onClick={() => {
                    setSelectedLocale(l.identifier);
                    close();
                  }}
                  className="flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1 text-left text-text-secondary select-none hover:bg-bg-hover hover:text-text"
                >
                  <span className="flex-1 truncate text-[12px]">{l.displayName}</span>
                  {selectedLocale === l.identifier && (
                    <Check size={12} className="mr-1 shrink-0 text-text" />
                  )}
                </button>
              ))}
            </SimpleBar>

            <div className="my-1 h-px bg-border-soft" />
            <div className="flex items-center justify-between gap-2 px-2 py-1">
              <span className="text-[12px] text-text-secondary select-none">Hold to record</span>
              <Toggle checked={holdToRecord} onChange={setHoldToRecord} />
            </div>
          </div>
        )}
      </Popover>
    </div>
  );
}

export default MicButton;
