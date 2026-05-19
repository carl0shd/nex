import { useCallback, useEffect, useRef, useState } from 'react';

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
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [confidence, setConfidence] = useState<number | null>(null);
  const finalsRef = useRef<string[]>([]);
  const onTranscriptRef = useRef(onTranscript);
  const onPartialRef = useRef(onPartial);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onPartialRef.current = onPartial;
  }, [onTranscript, onPartial]);

  useEffect(() => {
    const unsubscribe = window.api.speech.onEvent((event) => {
      switch (event.type) {
        case 'state':
          if (event.state === 'listening') setIsRecording(true);
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
          setIsRecording(false);
          setInterimText('');
          break;
        case 'end': {
          setIsRecording(false);
          setInterimText('');
          const text = finalsRef.current.join(' ').trim();
          finalsRef.current = [];
          if (text) onTranscriptRef.current(text);
          break;
        }
      }
    });
    return unsubscribe;
  }, []);

  const start = useCallback(async (): Promise<void> => {
    finalsRef.current = [];
    setInterimText('');
    setConfidence(null);
    setIsRecording(true);
    const auth = await window.api.speech.requestAuth();
    if (!auth.authorized) {
      setIsRecording(false);
      return;
    }
    await window.api.speech.start({
      locale: locale ?? undefined,
      deviceId: deviceId ?? undefined,
      continuous: true
    });
  }, [locale, deviceId]);

  const stop = useCallback((): void => {
    setIsRecording(false);
    void window.api.speech.stop();
  }, []);

  const cancel = useCallback((): void => {
    setIsRecording(false);
    void window.api.speech.cancel();
  }, []);

  return { isRecording, interimText, confidence, start, stop, cancel };
}
