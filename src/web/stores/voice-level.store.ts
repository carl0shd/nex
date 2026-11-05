import { create } from "zustand";
import { voiceBands } from "@/lib/voice-bands";

interface VoiceLevelStore {
  bands: number[];
  loudness: number;
  setLoudness: (loudness: number) => void;
  setBands: (bands: number[]) => void;
}

export const useVoiceLevelStore = create<VoiceLevelStore>((set) => ({
  bands: voiceBands(0),
  loudness: 0,
  setLoudness: (loudness) => set({ bands: voiceBands(loudness), loudness }),
  setBands: (bands) =>
    set({ bands, loudness: bands.reduce((sum, band) => sum + band, 0) / bands.length }),
}));
