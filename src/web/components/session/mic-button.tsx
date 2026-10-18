import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, ChevronDown } from 'lucide-react';
import SimpleBar from 'simplebar-react';
import PopoverMenu from '@/components/ui/popover-menu';
import { Switch } from '@/components/ui/switch';
import { useMicStore } from '@/stores/mic.store';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import GlideHighlight from '@/components/ui/glide-highlight';
import MenuRow from '@/components/ui/menu-row';
import { cn } from '@/lib/utils';

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDevices();

    void loadLocales();
    const unsubscribe = window.api.speech.onEvent((event) => {
      if (event.type === 'devicesChanged') void loadDevices();
    });
    return unsubscribe;
  }, [loadDevices, loadLocales]);

  // In hold-to-record mode a short tap toggles and stays on; a long press is
  // push-to-talk and stops on release.
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
      className={cn(
        'interactive flex h-7 items-center rounded-full',
        isRecording ? 'bg-green/15' : 'hover:bg-hover-2'
      )}
    >
      <button
        type="button"
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={cn(
          'interactive flex cursor-pointer items-center rounded-l-full py-1.5 pr-1 pl-2',
          isRecording ? 'text-green' : 'text-ink-3 hover:text-ink'
        )}
      >
        <Mic size={14} />
      </button>
      <PopoverMenu
        anchor="top end"
        gap={6}
        trigger={
          <span
            onClick={() => void loadDevices()}
            className={cn(
              'interactive flex cursor-pointer items-center rounded-r-full py-1.5 pr-2 pl-0.5',
              isRecording ? 'text-green' : 'text-ink-3 hover:text-ink'
            )}
          >
            <ChevronDown size={11} />
          </span>
        }
        className="w-72 animate-pop-in rounded-card bg-surface-raised p-1 shadow-overlay"
      >
        {({ close }) => (
          <GlideHighlight className="flex flex-col gap-px">
            <div className="eyebrow px-2 pt-1.5 pb-1 select-none">Microphone</div>
            {devices.length === 0 && (
              <div className="px-2 py-1.5 text-xs text-ink-3 select-none">No input devices</div>
            )}
            {devices.map((d) => {
              const isSelected =
                selectedDeviceId === d.id || (selectedDeviceId === null && d.isDefault);
              return (
                <MenuRow
                  key={d.id}
                  selected={isSelected}
                  label={`${d.isDefault ? `Default - ${d.name}` : d.name}${d.isBuiltIn ? ' (Built-in)' : ''}`}
                  onClick={() => {
                    setSelectedDevice(d.isDefault ? null : d.id);
                    close();
                  }}
                />
              );
            })}

            <div className="my-1 h-px bg-line-soft" />

            <div className="eyebrow px-2 pt-1.5 pb-1 select-none">Language</div>
            <SimpleBar autoHide={false} style={{ maxHeight: 120 }}>
              <MenuRow
                label="Auto (system)"
                selected={selectedLocale === null}
                onClick={() => {
                  setSelectedLocale(null);
                  close();
                }}
              />
              {locales.map((l) => (
                <MenuRow
                  key={l.identifier}
                  label={l.displayName}
                  selected={selectedLocale === l.identifier}
                  onClick={() => {
                    setSelectedLocale(l.identifier);
                    close();
                  }}
                />
              ))}
            </SimpleBar>

            <div className="my-1 h-px bg-line-soft" />
            <div className="flex h-8 items-center justify-between gap-2 px-2">
              <span className="text-sm text-ink-2 select-none">Hold to record</span>
              <Switch checked={holdToRecord} onCheckedChange={setHoldToRecord} />
            </div>
          </GlideHighlight>
        )}
      </PopoverMenu>
    </div>
  );
}

export default MicButton;
