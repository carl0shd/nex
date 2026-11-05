const BAND_COUNT = 5;
const SILENCE = 0.12;
const LOUDNESS_GAIN = 1.4;

export function voiceBands(loudness: number, count = BAND_COUNT): number[] {
  if (loudness < SILENCE) return Array.from({ length: count }, () => 0);
  const ceiling = Math.min(1, loudness * LOUDNESS_GAIN);
  return Array.from({ length: count }, () => ceiling * (0.25 + Math.random() * 0.75));
}
