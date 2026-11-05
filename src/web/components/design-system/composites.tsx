import { WaitingCardSample, WorkingCardSample } from "@/components/design-system/task-card-samples";
import { QuestionCardDemo } from "@/components/design-system/question-card-demo";
import { TitlebarView } from "@/components/layout/titlebar";
import { Sidebar } from "@/components/sidebar/sidebar";
import { SidebarRail } from "@/components/sidebar/sidebar-rail";
import { WORKSPACES } from "@/components/design-system/sidebar-samples";
import { Section, Specimen } from "@/components/design-system/specimen";

export function Shell() {
  return (
    <Section id="shell" title="Shell" description="Titlebar, sidebar and its collapsed rail.">
      <Specimen name="Titlebar" className="p-0">
        <div className="w-full overflow-hidden rounded-panel bg-page">
          <TitlebarView usage={{ percent: 62, cost: "$12.40" }} />
        </div>
      </Specimen>
      <Specimen name="Titlebar · collapsed sidebar" className="p-0">
        <div className="w-full overflow-hidden rounded-panel bg-page">
          <TitlebarView collapsed usage={{ percent: 62, cost: "$12.40" }} />
        </div>
      </Specimen>
      <div className="flex items-start gap-6">
        <Specimen name="Sidebar" bare>
          <div className="h-[640px] overflow-hidden rounded-panel shadow-hairline">
            <Sidebar
              workspaces={WORKSPACES}
              activeTaskId="fix-login-redirect"
              needsYou={1}
              className="h-full"
            />
          </div>
        </Specimen>
        <Specimen name="SidebarRail" bare>
          <div className="flex h-[640px] overflow-hidden rounded-panel shadow-hairline">
            <SidebarRail workspaces={WORKSPACES} activeWorkspaceId="monoku" needsYou />
          </div>
        </Specimen>
      </div>
    </Section>
  );
}

export function TaskCards() {
  return (
    <Section
      id="task-card"
      title="Task card"
      description="Header, task views with quick commands, the agent conversation and the composer."
    >
      <div className="flex flex-wrap items-start gap-6">
        <Specimen name="TaskCard · working" bare>
          <WorkingCardSample />
        </Specimen>
        <Specimen name="TaskCard · needs you" bare>
          <WaitingCardSample />
        </Specimen>
      </div>
      <Specimen name="QuestionCard · Claude asks" bare>
        <div className="w-[564px]">
          <QuestionCardDemo />
        </div>
      </Specimen>
    </Section>
  );
}
