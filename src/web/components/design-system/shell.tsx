import { useState } from "react";
import { ShellView, type ShellTerminal } from "@/components/terminal/shell-view";
import type { TerminalHandle } from "@/components/terminal/terminal-surface";
import {
  DEV_OUTPUT,
  SHELL_PROMPT,
  TEST_OUTPUT,
  ZSH_OUTPUT,
} from "@/components/design-system/shell-samples";
import { Section, Specimen } from "@/components/design-system/specimen";

const TERMINALS: ShellTerminal[] = [
  { id: "dev", name: "dev", port: 5173, running: true, output: DEV_OUTPUT },
  { id: "test", name: "test", running: true, output: TEST_OUTPUT },
  { id: "zsh", name: "zsh", output: ZSH_OUTPUT },
];

function echo(data: string, terminal: TerminalHandle) {
  if (data === "\r") terminal.write(`\r\n${SHELL_PROMPT}`);
  else if (data === "\x7f") terminal.write("\b \b");
  else if (data >= " ") terminal.write(data);
}

export function ShellDemo() {
  const [terminals, setTerminals] = useState(TERMINALS);
  return (
    <ShellView
      terminals={terminals}
      onInput={(_id, data, terminal) => echo(data, terminal)}
      onNewTerminal={() =>
        setTerminals((current) => [
          ...current,
          { id: `zsh-${current.length}`, name: `zsh ${current.length - 1}`, output: ZSH_OUTPUT },
        ])
      }
      onStop={(id) =>
        setTerminals((current) =>
          current.map((terminal) =>
            terminal.id === id ? { ...terminal, running: false } : terminal,
          ),
        )
      }
    />
  );
}

export function Shell() {
  return (
    <Section
      id="shell-view"
      title="Shell"
      description="The worktree's terminals. Quick commands open their own; type in zsh to try it."
    >
      <Specimen name="ShellView" bare>
        <div className="flex h-[560px] w-[600px] flex-col overflow-hidden rounded-card bg-surface shadow-card">
          <ShellDemo />
        </div>
      </Specimen>
    </Section>
  );
}
