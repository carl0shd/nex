import { Chip, CountChip } from "@/components/atoms/chip";
import { EnvButton } from "@/components/task/env-button";

export function TabBarTrailing() {
  return (
    <>
      <EnvButton state="running" label="monoku-fix-login.nex · 4 services running" />
      <Chip>test</Chip>
      <CountChip count={3} />
    </>
  );
}
