import type { CSSProperties } from "react";

const LAYERS = Array.from({ length: 14 }, (_, index) => 13 - index);
const PIXELS = [
  "boot-spark boot-spark-a",
  "boot-spark boot-spark-b",
  "boot-wave boot-wave-tail",
  "boot-wave boot-wave-core",
  "boot-wave boot-wave-head",
  "boot-lead boot-lead-a",
  "boot-lead boot-lead-b",
  "boot-scout-a",
  "boot-scout-b",
];

export function BootField({ front }: { front: string }) {
  return (
    <span aria-hidden className="boot-field" style={{ "--boot-f": front } as CSSProperties}>
      <span className="boot-px boot-track" />
      {LAYERS.map((layer) => (
        <span key={layer} className={`boot-px boot-layer boot-k${layer}`} />
      ))}
      {PIXELS.map((name) => (
        <span key={name} className={`boot-px ${name}`} />
      ))}
    </span>
  );
}
