import { NotesView } from "@/components/notes/notes-view";
import { TASK_NOTES } from "@/components/design-system/notes-samples";
import { Section, Specimen } from "@/components/design-system/specimen";

const SAVED_AT = Date.now() - 2 * 60_000;

export function Notes() {
  return (
    <Section
      id="notes"
      title="Notes"
      description="Markdown notes for the task that save themselves. Select text to format it; hover a block for + and the handle."
    >
      <Specimen name="NotesView" bare>
        <div className="flex h-[640px] w-[600px] flex-col overflow-hidden rounded-card bg-surface shadow-card">
          <NotesView defaultValue={TASK_NOTES} savedAt={SAVED_AT} />
        </div>
      </Specimen>
    </Section>
  );
}
