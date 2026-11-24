import type { StripItem } from "@/components/home/agent-strip";
import type { HomeStatsData } from "@/lib/home-stats";
import { byStatus, statusCounts, type TaskStatusItem } from "@/lib/task-status";
import {
  IdleCardSample,
  WaitingCardSample,
  WorkingCardSample,
} from "@/components/design-system/task-card-samples";

const ITEMS: StripItem[] = [
  {
    id: "onboarding-copy",
    name: "Onboarding copy pass",
    card: (
      <IdleCardSample
        title="Onboarding copy pass"
        project="website"
        branch="copy/onboarding"
        ask="Tighten the onboarding copy, keep it under two lines per step."
        answer="Done. Each step is one sentence now and the CTA labels match the sidebar."
      />
    ),
  },
  { id: "fix-login-redirect", name: "Fix login redirect param", card: <WorkingCardSample /> },
  {
    id: "migrate-db-schema",
    name: "Rename users to accounts",
    waiting: true,
    card: <WaitingCardSample />,
  },
  {
    id: "usage-panel",
    name: "Usage panel charts",
    card: <WorkingCardSample state="rest" />,
  },
  {
    id: "landing-hero",
    name: "New landing hero",
    card: (
      <IdleCardSample
        title="New landing hero"
        project="website"
        branch="feat/landing-hero"
        ask="Try a calmer hero: one line, the product shot, no gradient."
        answer="Pushed two variants to the preview link. The second one keeps the CTA above the fold."
      />
    ),
  },
];

const IDLE_ITEMS: StripItem[] = [ITEMS[0], ITEMS[4]].filter((item) => item !== undefined);

const WAITING_ITEMS: StripItem[] = [
  "Rename users to accounts",
  "Drop legacy sessions",
  "Split billing tables",
].map((name, index) => ({
  id: `waiting-${index}`,
  name,
  waiting: true,
  card: <WaitingCardSample />,
}));

const EXTRA_TASKS: (Omit<TaskStatusItem, "id" | "title"> & { name: string })[] = [
  { name: "Search ranking tweaks", status: "running", project: "nex", age: "12m" },
  { name: "Invoice PDF export", status: "idle", project: "api", age: "3h" },
  { name: "Dark mode for emails", status: "idle", project: "website", age: "5h" },
  { name: "Rate limit the webhooks", status: "waiting", project: "api", age: "" },
];

const EXTRAS = EXTRA_TASKS.map((extra, index) => ({
  ...extra,
  id: `extra-${index}`,
  title: extra.name,
}));

const EXTRA_ITEMS: StripItem[] = EXTRAS.map((extra) => ({
  id: extra.id,
  name: extra.name,
  waiting: extra.status === "waiting",
  card: extra.status === "waiting" ? <WaitingCardSample /> : <WorkingCardSample state="rest" />,
}));

type SampleStatus = Pick<TaskStatusItem, "project" | "status" | "age">;

const STATUS: Record<string, SampleStatus> = {
  "onboarding-copy": { project: "website", status: "idle", age: "2h" },
  "fix-login-redirect": { project: "nex", status: "running", age: "now" },
  "migrate-db-schema": { project: "api", status: "waiting", age: "" },
  "usage-panel": { project: "nex", status: "running", age: "4m" },
  "landing-hero": { project: "website", status: "idle", age: "1d" },
  ...Object.fromEntries(
    EXTRAS.map(({ id, project, status, age }) => [id, { project, status, age }]),
  ),
  ...Object.fromEntries(
    WAITING_ITEMS.map((item) => [item.id, { project: "api", status: "waiting", age: "" }]),
  ),
};

export function sampleStatusItems(items: readonly StripItem[]): TaskStatusItem[] {
  return items
    .map((item) => ({
      id: item.id,
      title: item.name,
      ...(STATUS[item.id] ?? { project: "nex", status: "idle", age: "" }),
    }))
    .toSorted(byStatus);
}

export const STRIP_CASES = {
  mixed: { label: "Mixed", items: ITEMS, initial: "fix-login-redirect" },
  one: {
    label: "One task",
    items: [ITEMS[1]].filter((item) => item !== undefined),
    initial: "fix-login-redirect",
  },
  waiting: { label: "All need you", items: WAITING_ITEMS, initial: "waiting-0" },
  done: { label: "All idle", items: IDLE_ITEMS, initial: "onboarding-copy" },
  busy: { label: "Busy", items: [...ITEMS, ...EXTRA_ITEMS], initial: "fix-login-redirect" },
} satisfies Record<string, { label: string; items: StripItem[]; initial: string }>;

export type StripCase = keyof typeof STRIP_CASES;

export const STRIP_CASE_IDS = Object.keys(STRIP_CASES) as StripCase[];

export const STRIP_CASE_LABELS = Object.fromEntries(
  STRIP_CASE_IDS.map((id) => [id, STRIP_CASES[id].label]),
) as Record<StripCase, string>;

const SAMPLE_LIMIT: Record<StripCase, number> = {
  mixed: 42,
  one: 12,
  waiting: 88,
  done: 64,
  busy: 71,
};

export function sampleStats(shown: StripCase): HomeStatsData {
  return {
    tasks: statusCounts(sampleStatusItems(STRIP_CASES[shown].items)),
    spend: { today: "$73.54", compared: "+18% vs your daily avg" },
    limit: { label: "Session limit", percent: SAMPLE_LIMIT[shown], resetsIn: "Resets in 2h 10m" },
    environments: { running: shown === "busy" ? 5 : 2, usedGb: 3.4, totalGb: 8 },
  };
}
