import { existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

export type CommandSource = "project" | "personal" | "builtin" | "skill";

export interface AgentCommand {
  name: string;
  description: string;
  args?: string;
  source: CommandSource;
}

interface RawCommand {
  name?: string;
  description?: string;
  argumentHint?: string;
  builtin?: boolean;
}

function sourceOf(command: RawCommand, cwd: string): CommandSource {
  if (command.builtin) return "builtin";
  const file = `${command.name}.md`;
  if (existsSync(join(cwd, ".claude", "commands", file))) return "project";
  if (existsSync(join(homedir(), ".claude", "commands", file))) return "personal";
  return "skill";
}

export function toAgentCommands(raw: unknown, cwd: string): AgentCommand[] {
  if (!Array.isArray(raw)) return [];
  return (raw as RawCommand[])
    .filter((command) => command.name)
    .map((command) => ({
      name: String(command.name),
      description: command.description ?? "",
      args: command.argumentHint || undefined,
      source: sourceOf(command, cwd),
    }));
}
