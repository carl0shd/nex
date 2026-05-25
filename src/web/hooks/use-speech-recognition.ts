import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useMicStore } from '@/stores/mic.store';

interface UseSpeechRecognitionOptions {
  locale?: string | null;
  deviceId?: number | null;
  onTranscript: (text: string) => void;
  onPartial?: (text: string) => void;
}

interface UseSpeechRecognitionReturn {
  isRecording: boolean;
  /** Live transcription as it's being typed. Cleared on stop. */
  interimText: string;
  /** Confidence of the most recent result (0..1), if available. */
  confidence: number | null;
  start: () => Promise<void>;
  stop: () => void;
  cancel: () => void;
}

export function useSpeechRecognition({
  locale,
  deviceId,
  onTranscript,
  onPartial
}: UseSpeechRecognitionOptions): UseSpeechRecognitionReturn {
  const recorderId = useId();
  const isActive = useMicStore((s) => s.activeRecorderId === recorderId);
  const setActiveRecorder = useMicStore((s) => s.setActiveRecorder);

  const [internalRecording, setInternalRecording] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [confidence, setConfidence] = useState<number | null>(null);
  const finalsRef = useRef<string[]>([]);
  const onTranscriptRef = useRef(onTranscript);
  const onPartialRef = useRef(onPartial);
  const isActiveRef = useRef(isActive);

  const isRecording = isActive && internalRecording;

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onPartialRef.current = onPartial;
  }, [onTranscript, onPartial]);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    return () => {
      if (isActiveRef.current) setActiveRecorder(null);
    };
  }, [setActiveRecorder]);

  useEffect(() => {
    const unsubscribe = window.api.speech.onEvent((event) => {
      if (!isActiveRef.current) return;
      switch (event.type) {
        case 'state':
          if (event.state === 'listening') setInternalRecording(true);
          break;
        case 'partial':
          if (event.text !== undefined) {
            setInterimText(event.text);
            onPartialRef.current?.(event.text);
          }
          if (event.confidence !== undefined) setConfidence(event.confidence);
          break;
        case 'final':
          if (event.text) finalsRef.current.push(event.text);
          if (event.confidence !== undefined) setConfidence(event.confidence);
          setInterimText('');
          break;
        case 'error':
          setInternalRecording(false);
          setInterimText('');
          setActiveRecorder(null);
          break;
        case 'end': {
          setInternalRecording(false);
          setInterimText('');
          const text = finalsRef.current.join(' ').trim();
          finalsRef.current = [];
          if (text) onTranscriptRef.current(text);
          setActiveRecorder(null);
          break;
        }
      }
    });
    return unsubscribe;
  }, [setActiveRecorder]);

  const start = useCallback(async (): Promise<void> => {
    finalsRef.current = [];
    setInterimText('');
    setConfidence(null);
    setInternalRecording(true);
    setActiveRecorder(recorderId);
    const auth = await window.api.speech.requestAuth();
    if (!auth.authorized) {
      setInternalRecording(false);
      setActiveRecorder(null);
      return;
    }
    await window.api.speech.start({
      locale: locale ?? undefined,
      deviceId: deviceId ?? undefined,
      continuous: true
    });
  }, [locale, deviceId, recorderId, setActiveRecorder]);

  const stop = useCallback((): void => {
    setInternalRecording(false);
    void window.api.speech.stop();
  }, []);

  const cancel = useCallback((): void => {
    setInternalRecording(false);
    setActiveRecorder(null);
    void window.api.speech.cancel();
  }, [setActiveRecorder]);

  return { isRecording, interimText, confidence, start, stop, cancel };
}
