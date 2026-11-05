import { useState } from "react";
import { Chip, CountChip } from "@/components/atoms/chip";
import { AnchoredPopover } from "@/components/primitives/anchored-popover";
import { QuickCommandsMenu, type QuickCommandEntry } from "@/components/task/quick-commands-menu";

const SHOWN = 2;

export function QuickCommandChips({
  commands,
  onRun,
  onOpenTerminal,
  onStop,
  onEdit,
}: {
  commands: readonly QuickCommandEntry[];
  onRun: (name: string) => void;
  onOpenTerminal: (name: string) => void;
  onStop: (name: string) => void;
  onEdit?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const shown = commands.slice(0, SHOWN);
  const rest = commands.slice(SHOWN);
  const close = (action: (name: string) => void) => (name: string) => {
    setOpen(false);
    action(name);
  };
  return (
    <>
      {shown.map((command) => (
        <Chip key={command.name} running={command.running} onClick={() => onRun(command.name)}>
          {command.name}
        </Chip>
      ))}
      {rest.length > 0 && (
        <AnchoredPopover
          open={open}
          onOpenChange={setOpen}
          align="end"
          side="bottom"
          strategy="fixed"
          trigger={
            <CountChip
              count={rest.length}
              running={rest.some((command) => command.running)}
              open={open}
              onClick={() => setOpen((value) => !value)}
            />
          }
        >
          <QuickCommandsMenu
            commands={commands}
            onRun={close(onRun)}
            onOpenTerminal={close(onOpenTerminal)}
            onStop={onStop}
            onEdit={
              onEdit &&
              (() => {
                setOpen(false);
                onEdit();
              })
            }
          />
        </AnchoredPopover>
      )}
    </>
  );
}
