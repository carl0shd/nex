import { useState } from "react";
import { Chip, CountChip } from "@/components/atoms/chip";
import { AnchoredPopover } from "@/components/primitives/anchored-popover";
import {
  QuickCommandsMenu,
  type ClaudeCommandEntry,
  type QuickCommandEntry,
} from "@/components/task/quick-commands-menu";

const SHOWN = 2;

export function QuickCommandChips({
  commands,
  claudeCommands = [],
  onRun,
  onOpenTerminal,
  onStop,
  onStopClaude,
  onEdit,
}: {
  commands: readonly QuickCommandEntry[];
  claudeCommands?: readonly ClaudeCommandEntry[];
  onRun: (name: string) => void;
  onOpenTerminal: (name: string) => void;
  onStop: (name: string) => void;
  onStopClaude?: (id: string) => void;
  onEdit?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ordered = [
    ...commands.filter((command) => command.running),
    ...commands.filter((command) => !command.running),
  ];
  const shown = ordered.slice(0, SHOWN);
  const rest = ordered.slice(SHOWN);
  const hidden = rest.length + claudeCommands.length;
  const close = (action: (name: string) => void) => (name: string) => {
    setOpen(false);
    action(name);
  };
  return (
    <>
      {shown.map((command) => (
        <Chip
          key={command.name}
          running={command.running}
          meta={command.running && command.port ? `:${command.port}` : undefined}
          onClick={() => onRun(command.name)}
        >
          {command.name}
        </Chip>
      ))}
      {hidden > 0 && (
        <AnchoredPopover
          open={open}
          onOpenChange={setOpen}
          align="end"
          side="bottom"
          strategy="fixed"
          trigger={
            <CountChip
              count={hidden}
              running={claudeCommands.length > 0 || rest.some((command) => command.running)}
              open={open}
              onClick={() => setOpen((value) => !value)}
            />
          }
        >
          <QuickCommandsMenu
            commands={commands}
            claudeCommands={claudeCommands}
            onRun={close(onRun)}
            onOpenTerminal={close(onOpenTerminal)}
            onStop={onStop}
            onStopClaude={onStopClaude}
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
