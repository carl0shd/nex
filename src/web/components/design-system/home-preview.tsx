import { AddAgentSlot } from "@/components/home/add-agent-slot";
import { AgentStrip, StripSummary } from "@/components/home/agent-strip";
import {
  sampleStatusItems,
  STRIP_CASES,
  type StripCase,
} from "@/components/design-system/home-samples";
import { statusCounts } from "@/lib/task-status";

export function SampleStrip({ shown, initialId }: { shown: StripCase; initialId?: string }) {
  const current = STRIP_CASES[shown];
  return (
    <AgentStrip
      key={shown}
      items={current.items}
      initialId={initialId ?? current.initial}
      summary={<StripSummary {...statusCounts(sampleStatusItems(current.items))} />}
      trailing={current.items.length === 1 && <AddAgentSlot />}
    />
  );
}
