import type { ComponentProps } from "react";
import { Meter } from "@/components/atoms/meter";
import { StripSummary } from "@/components/home/agent-strip";
import { HomeStat } from "@/components/home/home-stat";
import type { HomeStatsData } from "@/lib/home-stats";
import { usageTone } from "@/lib/usage";
import { cn } from "@/lib/utils";

const TILE_STAGGER_MS = 40;
const FIRST_TILE_DELAY_MS = 120;

type Tile = ComponentProps<typeof HomeStat> & { id: string };

export function HomeStats({
  stats,
  onTasks,
  onUsage,
  onEnvironments,
  className,
}: {
  stats: HomeStatsData;
  onTasks?: () => void;
  onUsage?: () => void;
  onEnvironments?: () => void;
  className?: string;
}) {
  const { tasks, spend, limit, environments } = stats;
  const tiles: Tile[] = [
    {
      id: "tasks",
      label: "Tasks",
      value: String(tasks.working + tasks.waiting + tasks.idle),
      detail: <StripSummary {...tasks} />,
      onClick: onTasks,
    },
  ];
  if (spend) {
    tiles.push({
      id: "spend",
      label: "Spent today",
      value: spend.today,
      detail: spend.compared,
      onClick: onUsage,
    });
  }
  if (limit) {
    tiles.push({
      id: "limit",
      label: limit.label,
      value: `${limit.percent}%`,
      meter: (
        <Meter
          value={limit.percent}
          tone={usageTone(limit.percent)}
          width="full"
          showValue={false}
          className="flex-1"
        />
      ),
      detail: limit.resetsIn,
      onClick: onUsage,
    });
  }
  if (environments) {
    tiles.push({
      id: "environments",
      label: "Environments",
      value: String(environments.running),
      detail: `${environments.usedGb.toFixed(1)} of ${environments.totalGb} GB in use`,
      onClick: onEnvironments,
    });
  }

  return (
    <div
      className={cn("grid w-full gap-2.5", className)}
      style={{ gridTemplateColumns: `repeat(${tiles.length}, minmax(0, 1fr))` }}
    >
      {tiles.map(({ id, ...tile }, index) => (
        <HomeStat
          key={id}
          {...tile}
          style={{ animationDelay: `${FIRST_TILE_DELAY_MS + index * TILE_STAGGER_MS}ms` }}
        />
      ))}
    </div>
  );
}
