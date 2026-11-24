import { Button } from "@/components/atoms/button";
import { Slider } from "@/components/atoms/slider";
import { formatHour, SCENE_PHASE_LABELS, scenePhase } from "@/lib/dither-scene";
import { cn } from "@/lib/utils";

export function SceneHourSlider({
  hour,
  onChange,
  onReset,
  className,
}: {
  hour: number;
  onChange: (hour: number) => void;
  onReset?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-10 w-[380px] items-center gap-3 rounded-full bg-glass pr-1.5 pl-4 text-xs shadow-toast backdrop-blur-[28px] backdrop-saturate-[1.1]",
        className,
      )}
    >
      <span className="w-[62px] shrink-0 whitespace-nowrap text-ink tabular-nums">
        {formatHour(hour)}
      </span>
      <Slider
        label="Time of day"
        value={hour}
        min={0}
        max={23.75}
        step={0.25}
        onChange={onChange}
        className="flex-1"
      />
      <span className="w-9 shrink-0 text-ink-3">{SCENE_PHASE_LABELS[scenePhase(hour)]}</span>
      <Button
        size="xs"
        variant="quiet"
        disabled={!onReset}
        onClick={onReset}
        className="rounded-full"
      >
        Now
      </Button>
    </div>
  );
}
