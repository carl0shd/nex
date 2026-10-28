import type { ReactNode } from "react";
import { AgentStrip, StripSummary, type StripItem } from "@/components/home/agent-strip";
import { HomeEmpty } from "@/components/home/home-empty";
import { Sidebar } from "@/components/sidebar/sidebar";
import { WORKSPACES } from "@/components/design-system/sidebar-samples";
import { Section, Specimen } from "@/components/design-system/specimen";
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

function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[880px] w-full overflow-hidden rounded-card bg-page shadow-card">
      {children}
    </div>
  );
}

export function Home() {
  return (
    <Section
      id="home"
      title="Home"
      description="Every running agent side by side; the map at the bottom jumps between them. With no tasks, the empty state starts one."
    >
      <Specimen name="Home · live strip" bare>
        <Frame>
          <Sidebar workspaces={WORKSPACES} needsYou={1} />
          <AgentStrip
            items={ITEMS}
            initialId="fix-login-redirect"
            summary={<StripSummary working={3} waiting={1} idle={2} />}
          />
        </Frame>
      </Specimen>
      <Specimen name="Home · nothing running" bare>
        <div className="flex h-[620px] w-full overflow-hidden rounded-card bg-page shadow-card">
          <HomeEmpty />
        </div>
      </Specimen>
    </Section>
  );
}
