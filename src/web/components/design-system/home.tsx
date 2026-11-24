import { useState, type ReactNode } from "react";
import { SegmentedControl } from "@/components/atoms/segmented-control";
import { HomeBackdrop } from "@/components/home/home-backdrop";
import { HomeHero } from "@/components/home/home-hero";
import { SampleHomePrompt } from "@/components/design-system/sample-home-prompt";
import { SceneHourSlider } from "@/components/home/scene-hour-slider";
import { HomeStats } from "@/components/home/home-stats";
import { TasksEmpty } from "@/components/home/tasks-empty";
import { greeting, scenePhase } from "@/lib/dither-scene";
import { statusCounts } from "@/lib/task-status";
import { Sidebar } from "@/components/sidebar/sidebar";
import { WORKSPACES } from "@/components/design-system/sidebar-samples";
import { Section, Specimen } from "@/components/design-system/specimen";
import {
  sampleStats,
  sampleStatusItems,
  STRIP_CASE_IDS,
  STRIP_CASE_LABELS,
  STRIP_CASES,
  type StripCase,
} from "@/components/design-system/home-samples";
import { SampleStrip } from "@/components/design-system/home-preview";

const OVERVIEW_OPTIONS: readonly (StripCase | "none")[] = ["none", ...STRIP_CASE_IDS];
const OVERVIEW_LABELS: Record<StripCase | "none", string> = {
  none: "No tasks",
  ...STRIP_CASE_LABELS,
};

function TasksOverScene() {
  const [hour, setHour] = useState(22);
  const [shown, setShown] = useState<StripCase | "none">("mixed");
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center gap-3">
        <SegmentedControl
          options={OVERVIEW_OPTIONS}
          labels={OVERVIEW_LABELS}
          value={shown}
          onChange={setShown}
        />
        <SceneHourSlider hour={hour} onChange={setHour} />
      </div>
      <Frame>
        <Sidebar
          workspaces={WORKSPACES}
          tasksActive
          overviewActive={false}
          needsYou={
            shown === "none" ? 0 : statusCounts(sampleStatusItems(STRIP_CASES[shown].items)).waiting
          }
        />
        <div className="relative flex min-w-0 flex-1">
          <HomeBackdrop phase={scenePhase(hour)} />
          {shown === "none" ? <TasksEmpty /> : <SampleStrip shown={shown} />}
        </div>
      </Frame>
    </div>
  );
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[880px] w-full overflow-hidden rounded-card bg-page shadow-card">
      {children}
    </div>
  );
}

function OverviewScene() {
  const [hour, setHour] = useState(22);
  const [shown, setShown] = useState<StripCase | "none">("mixed");
  return (
    <div className="flex w-full flex-col gap-3">
      <SegmentedControl
        options={OVERVIEW_OPTIONS}
        labels={OVERVIEW_LABELS}
        value={shown}
        onChange={setShown}
        className="self-start"
      />
      <div className="flex h-[760px] w-full overflow-hidden rounded-card bg-page shadow-card">
        <HomeHero
          key={shown}
          phase={scenePhase(hour)}
          greeting={greeting(hour)}
          prompt={<SampleHomePrompt />}
          stats={
            <HomeStats
              onTasks={() => {}}
              onUsage={() => {}}
              onEnvironments={() => {}}
              stats={
                shown === "none"
                  ? { ...sampleStats("one"), tasks: { working: 0, waiting: 0, idle: 0 } }
                  : sampleStats(shown)
              }
            />
          }
          footer={<SceneHourSlider hour={hour} onChange={setHour} />}
        />
      </div>
    </div>
  );
}

export function Home() {
  return (
    <Section
      id="home"
      title="Home"
      description="The overview is a dithered sea that follows the time of day, the greeting, a box that starts a task and the day at a glance: tasks, spend, the usage limit and environments. Tasks shows every running agent side by side; the map at the bottom jumps between them."
    >
      <Specimen name="Tasks · the strip over the scene · pick a case and an hour" bare>
        <TasksOverScene />
      </Specimen>
      <Specimen name="Home · overview · stats under the box" bare>
        <OverviewScene />
      </Specimen>
    </Section>
  );
}
