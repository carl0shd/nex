import { useState } from "react";
import { Section, Specimen } from "@/components/design-system/specimen";
import { TitlebarView } from "@/components/layout/titlebar";
import type { UsageAccount } from "@/components/usage/account-switch";
import type { SessionWindow } from "@/components/usage/session-limit";
import type { DailySpend } from "@/components/usage/spend-trend";
import { UsagePanel, type UsageTask } from "@/components/usage/usage-panel";

const ACCOUNTS: UsageAccount[] = [
  { id: "monoku", name: "Monoku", color: "#33843F" },
  { id: "personal", name: "Personal", color: "#6b21a8" },
  { id: "studio", name: "Studio", color: "#3f6fb5" },
  { id: "side", name: "Side projects", color: "#b07a1f" },
];

const SESSION: SessionWindow = {
  percent: 62,
  projected: 85,
  resetsIn: "1h 20m",
  startedAt: "10:40",
  resetsAt: "3:40 PM",
  forecast: "At this pace you end the window around 85%",
};

const NEAR_LIMIT: SessionWindow = {
  percent: 86,
  projected: 100,
  resetsIn: "2h 10m",
  startedAt: "12:20",
  resetsAt: "5:20 PM",
  forecast: "At this pace you hit the limit in ~32 min",
};

const SPEND: DailySpend = {
  today: "$12.40",
  inNex: "$9.80",
  outside: "$2.60",
  comparedToAverage: "+93% vs your daily avg",
  lastDays: [6.2, 9.8, 4.1, 0.6, 0.3, 11.4, 13.9, 8.7, 10.2, 7.5, 1.1, 0.4, 9.3, 12.4],
};

const TASKS: UsageTask[] = [
  { id: "usage", title: "Usage panel charts", project: "nex", status: "running", cost: "$4.12" },
  {
    id: "accounts",
    title: "Rename users to accounts",
    project: "api",
    status: "waiting",
    cost: "$2.86",
  },
  {
    id: "login",
    title: "Fix login redirect param",
    project: "nex",
    status: "running",
    cost: "$1.94",
  },
  {
    id: "onboarding",
    title: "Onboarding copy pass",
    project: "website",
    status: "running",
    cost: "$0.88",
  },
];

function UsageDemo({ session }: { session: SessionWindow }) {
  const [account, setAccount] = useState(ACCOUNTS[0].id);
  return (
    <UsagePanel
      accounts={ACCOUNTS}
      account={account}
      onAccountChange={setAccount}
      updated="Updated just now"
      session={session}
      switchTo="Personal"
      onSwitch={() => setAccount("personal")}
      spend={SPEND}
      tasks={TASKS}
      summary="6 tasks · 1.8M tokens today"
    />
  );
}

export function Usage() {
  return (
    <Section
      id="usage"
      title="Usage"
      description="The pill in the titlebar opens today's usage: the 5-hour session limit with its forecast, what you spent and which tasks spent it."
    >
      <Specimen name="Usage panel · press the pill to close and reopen it" bare>
        <div className="h-[780px] w-full rounded-card bg-page shadow-card">
          <TitlebarView
            usage={{ percent: SESSION.percent, cost: SPEND.today }}
            usagePanel={<UsageDemo session={SESSION} />}
            defaultUsageOpen
          />
        </div>
      </Specimen>
      <Specimen name="Near the limit · offers another account" bare>
        <UsageDemo session={NEAR_LIMIT} />
      </Specimen>
    </Section>
  );
}
