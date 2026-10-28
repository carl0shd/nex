import { ChangesDock, ChangesPanel } from "@/components/changes/changes-view";
import { CHANGED_FILES } from "@/components/design-system/changes-samples";
import { Section, Specimen } from "@/components/design-system/specimen";

export function Changes() {
  return (
    <Section
      id="changes"
      title="Changes"
      description="Everything the task changed since its base branch. Select lines to ask Claude about them."
    >
      <Specimen name="ChangesDock · side panel" bare>
        <div className="flex h-[640px] w-[490px] flex-col rounded-card bg-surface pt-3 shadow-card">
          <ChangesDock files={CHANGED_FILES} />
        </div>
      </Specimen>
      <Specimen name="ChangesPanel · expanded" bare>
        <div className="flex h-[700px] w-full overflow-hidden rounded-card bg-surface shadow-card">
          <ChangesPanel files={CHANGED_FILES} base="main" />
        </div>
      </Specimen>
    </Section>
  );
}
