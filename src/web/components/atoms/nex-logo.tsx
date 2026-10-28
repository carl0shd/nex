import { cn } from "@/lib/utils";

const MARK =
  "M0 0V18.8005V37.4574V56.2579H18.8309H37.518V74.9148H56.3488H75.0359V93.7153H93.8668H112.554V112.372H131.241H150.072V130.886H168.759H187.59V149.686H206.277H225.108V168.343H243.795H262.626V187V205.657H243.795H225.108V224.457H206.277H187.59V243.114H168.759H150.072V261.771H131.241H112.554V280.428H93.8668H75.0359V299.085H56.3488H37.518V317.886H18.8309H0V336.543V355.2V374H18.8309H37.518V355.2H56.3488H75.0359V336.543H93.8668H112.554V317.886H131.241H150.072V299.229H168.759H187.59V280.572H206.277H225.108V261.915H243.795H262.626V243.114H281.313H300V224.457V205.8V187V168.343V149.543V130.886H281.313H262.626V112.229H243.795H225.108V93.4282H206.277H187.59V74.7713H168.759H150.072V56.1143H131.241H112.554V37.4574H93.8668H75.0359V18.8005H56.3488H37.518V0H18.8309H0Z";

export function NexLogo({ height = 27, className }: { height?: number; className?: string }) {
  return (
    <svg
      height={height}
      width={(height * 300) / 374}
      viewBox="0 0 300 374"
      aria-hidden
      className={cn("fill-accent", className)}
    >
      <path d={MARK} />
    </svg>
  );
}

export function NexLogoTile({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Nex"
      className={cn(
        "flex size-14 items-center justify-center rounded-[16px] bg-surface shadow-[0_0_0_1px_var(--line-strong),0_8px_24px_-10px_rgb(0_0_0/60%)]",
        className,
      )}
    >
      <NexLogo height={27} />
    </span>
  );
}
