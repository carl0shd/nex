import markUrl from "@/assets/brand/nex-mark.webp";
import { cn } from "@/lib/utils";

const MARK_WIDTH = 360;
const MARK_HEIGHT = 434;
const WORDMARK_WIDTH = 1354;
const WORDMARK_TEXT =
  "M677.35 89.35H756.1V334H678.75L677.35 332.6L555.9 181.75V334H477.5V89.35H555.2L555.9 90.4L677.35 241.25V89.35ZM1045.01 146.4H870.011V183.15H1029.96V240.2H870.011V276.95H1045.01V334H791.611V89.35H1045.01V146.4ZM1353.92 89.35L1255.57 211.5L1353.92 334H1252.77L1204.82 274.5L1156.87 334H1056.07L1154.42 211.5L1056.07 89.35H1156.87L1204.82 148.85L1252.77 89.35H1353.92Z";

export function NexLogo({ height = 27, className }: { height?: number; className?: string }) {
  return (
    <img
      src={markUrl}
      alt=""
      draggable={false}
      height={height}
      width={(height * MARK_WIDTH) / MARK_HEIGHT}
      className={cn("shrink-0", className)}
    />
  );
}

export function NexWordmark({ height = 24, className }: { height?: number; className?: string }) {
  return (
    <svg
      role="img"
      aria-label="Nex"
      height={height}
      width={(height * WORDMARK_WIDTH) / MARK_HEIGHT}
      viewBox={`0 0 ${WORDMARK_WIDTH} ${MARK_HEIGHT}`}
      className={cn("shrink-0 text-ink", className)}
    >
      <image href={markUrl} width={MARK_WIDTH} height={MARK_HEIGHT} />
      <path d={WORDMARK_TEXT} fill="currentColor" />
    </svg>
  );
}
