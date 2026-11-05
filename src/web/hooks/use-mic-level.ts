import { useEffect } from "react";
import { voiceBands } from "@/lib/voice-bands";
import { useVoiceLevelStore } from "@/stores/voice-level.store";

const UPDATE_MS = 90;
const BANDS: [number, number][] = [
  [1, 3],
  [3, 6],
  [6, 11],
  [11, 20],
  [20, 40],
];

function bandLevels(bins: Uint8Array): number[] {
  const bands = BANDS.map(([from, to]) => {
    let sum = 0;
    for (let bin = from; bin < to; bin++) sum += bins[bin];
    return sum / (to - from) / 255;
  });
  return voiceBands(bands.reduce((sum, band) => sum + band, 0) / bands.length, bands.length);
}

async function openMicrophone(name: string): Promise<MediaStream> {
  const findDevice = async () =>
    (await navigator.mediaDevices.enumerateDevices()).find(
      (device) => device.kind === "audioinput" && device.label.includes(name),
    );
  let device = await findDevice();
  if (!device) {
    const probe = await navigator.mediaDevices.getUserMedia({ audio: true });
    probe.getTracks().forEach((track) => track.stop());
    device = await findDevice();
  }
  return navigator.mediaDevices.getUserMedia({
    audio: device ? { deviceId: { exact: device.deviceId } } : true,
  });
}

export function useMicLevel(name: string | undefined, enabled: boolean): void {
  useEffect(() => {
    if (!enabled || !name) return;
    let stopped = false;
    let stream: MediaStream | null = null;
    let context: AudioContext | null = null;
    let frame = 0;
    let lastUpdate = 0;

    void openMicrophone(name)
      .then((opened) => {
        if (stopped) return opened.getTracks().forEach((track) => track.stop());
        stream = opened;
        context = new AudioContext();
        const analyser = context.createAnalyser();
        analyser.fftSize = 512;
        analyser.minDecibels = -85;
        analyser.maxDecibels = -25;
        analyser.smoothingTimeConstant = 0.55;
        context.createMediaStreamSource(opened).connect(analyser);
        const bins = new Uint8Array(analyser.frequencyBinCount);
        const tick = (now: number) => {
          if (now - lastUpdate > UPDATE_MS) {
            lastUpdate = now;
            analyser.getByteFrequencyData(bins);
            useVoiceLevelStore.getState().setBands(bandLevels(bins));
          }
          frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      })
      .catch(() => {});

    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
      void context?.close();
      useVoiceLevelStore.getState().setLoudness(0);
    };
  }, [name, enabled]);
}
