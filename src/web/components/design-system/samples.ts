import type { QuickCommand } from "@native/db/types";
import type { GithubRepo } from "@native/git/github";
import type { RankedBarItem } from "@/components/ui/ranked-bar-list";
import type { SparklinePoint } from "@/components/ui/sparkline";
import type { StackedBarDatum } from "@/components/ui/stacked-bar-chart";

const SAMPLE_WORKSPACE_COLORS = ["#33843F", "#1e40af", "#6b21a8", "#c2410c"];

const SAMPLE_BRANCHES = [
  "main",
  "develop",
  "feat/design-system",
  "feat/github-import",
  "fix/terminal-resize",
  "chore/bump-electron",
  "refactor/sidebar-store",
  "feat/usage-panel",
];

const SAMPLE_QUICK_COMMANDS: QuickCommand[] = [
  { name: "dev", command: "yarn dev" },
  { name: "lint", command: "yarn lint --fix" },
];

const SAMPLE_REPOS: GithubRepo[] = [
  {
    name: "nex",
    nameWithOwner: "acme/nex",
    description: "Multi-IDE worktree manager",
    isPrivate: true,
    updatedAt: "2026-10-12T10:00:00Z",
  },
  {
    name: "website",
    nameWithOwner: "acme/website",
    description: "Marketing site",
    isPrivate: false,
    updatedAt: "2026-10-01T10:00:00Z",
  },
  {
    name: "api",
    nameWithOwner: "acme/api",
    description: "Public API gateway",
    isPrivate: true,
    updatedAt: "2026-09-20T10:00:00Z",
  },
];

const DAILY_COST = [4.2, 6.1, 0, 3.4, 8.9, 12.3, 7.7, 5.2, 9.8, 0.6, 0, 11.4, 6.6, 10.1];

const SAMPLE_SPARKLINE: SparklinePoint[] = DAILY_COST.map((value, i) => ({
  key: `d${i}`,
  value,
}));

const SAMPLE_STACKED_BARS: StackedBarDatum[] = DAILY_COST.map((value, i) => ({
  key: `d${i}`,
  label: `${i + 1}`,
  caption: `Oct ${i + 1}`,
  total: value * 1.6,
  highlight: value,
}));

const SAMPLE_RANKED: RankedBarItem[] = [
  { key: "nex", label: "nex", sublabel: "42 sessions", value: 61.2, barClass: "bg-chart-1" },
  { key: "web", label: "website", sublabel: "18 sessions", value: 23.9, barClass: "bg-chart-2" },
  { key: "api", label: "api", sublabel: "9 sessions", value: 12.4, barClass: "bg-chart-3" },
  { key: "docs", label: "docs", sublabel: "3 sessions", value: 4.1, barClass: "bg-chart-4" },
];

export {
  SAMPLE_WORKSPACE_COLORS,
  SAMPLE_BRANCHES,
  SAMPLE_QUICK_COMMANDS,
  SAMPLE_REPOS,
  SAMPLE_SPARKLINE,
  SAMPLE_STACKED_BARS,
  SAMPLE_RANKED,
};
