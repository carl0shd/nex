import type { AgentOption } from "@/components/new-task/agent-picker";
import type { NewTaskProject } from "@/components/new-task/place-pickers";

const MONOKU = { id: "monoku", name: "Monoku", color: "#33843F" };
const PERSONAL = { id: "personal", name: "Personal", color: "#6b21a8" };

export const SAMPLE_PROJECTS: NewTaskProject[] = [
  {
    id: "nex",
    name: "nex",
    workspace: MONOKU,
    branches: ["main", "develop", "release/2.4"],
    environment: true,
  },
  { id: "api", name: "api", workspace: MONOKU, branches: ["main", "staging"], environment: true },
  { id: "website", name: "website", workspace: MONOKU, branches: ["main"] },
  { id: "dotfiles", name: "dotfiles", workspace: PERSONAL, branches: ["master"] },
];

export const SAMPLE_AGENTS: AgentOption[] = [
  {
    id: "claude",
    name: "Claude Code",
    detail: "v2.4.1 · detected",
    installed: true,
    accounts: [
      { id: "work", name: "Work", plan: "Max", color: MONOKU.color, usedPercent: 62 },
      { id: "personal", name: "Personal", plan: "Pro", color: PERSONAL.color, usedPercent: 12 },
    ],
  },
  { id: "shell", name: "Shell only", detail: "A plain terminal, no agent", installed: true },
];
