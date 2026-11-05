import type { ReactNode } from "react";
import { Button } from "@/components/atoms/button";
import { Section, Specimen } from "@/components/design-system/specimen";
import {
  ARCHIVED,
  COPIED,
  CREATE_FAILED,
  CREATING,
  DONE,
  LIMIT,
  NEEDS_YOU,
  PUSHED,
  READ_FAILED,
  STOPPED,
  UPDATE,
} from "@/components/design-system/toast-samples";
import { CompactToast, Toast } from "@/components/primitives/toast";
import { dismissToast, notify, notifyCompact } from "@/lib/notify";

const CREATE_STEPS = [62, 84, 100];
const STEP_MS = 900;

function startCreating() {
  const id = notify({ ...CREATING, progress: CREATE_STEPS[0] });
  CREATE_STEPS.slice(1).forEach((progress, index) => {
    setTimeout(() => notify({ ...CREATING, progress }, { id }), STEP_MS * (index + 1));
  });
  setTimeout(
    () => notifyCompact({ tone: "green", title: "fix-login-redirect is ready" }, { id }),
    STEP_MS * CREATE_STEPS.length,
  );
}

function showBoardStack() {
  notify(STOPPED);
  notify(DONE);
  notify(NEEDS_YOU);
}

function ToastsDemo() {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Button size="sm" variant="inverse" onClick={showBoardStack}>
        Show the stack from the board
      </Button>
      <Button size="sm" onClick={() => notify(NEEDS_YOU)}>
        Agent needs you
      </Button>
      <Button size="sm" onClick={() => notify(DONE)}>
        Agent finished
      </Button>
      <Button size="sm" onClick={startCreating}>
        Create a task
      </Button>
      <Button size="sm" onClick={() => notify(ARCHIVED)}>
        Archive a task
      </Button>
      <Button size="sm" onClick={() => notifyCompact(COPIED)}>
        Copy a path
      </Button>
      <Button size="sm" variant="quiet" onClick={() => dismissToast()}>
        Dismiss all
      </Button>
    </div>
  );
}

function Column({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="flex w-[340px] flex-col gap-7">
      <h3 className="m-0 text-base font-semibold text-ink">{title}</h3>
      {children}
    </section>
  );
}

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-xs text-ink-4">{label}</span>
      {children}
    </div>
  );
}

export function Toasts() {
  return (
    <Section
      id="toasts"
      title="Toasts"
      description="Bottom right, newest in front. Agent toasts stay until handled; confirmations leave on their own. Hover the stack to fan it out and pause the timers."
    >
      <Specimen name="Toaster · they land at the bottom right of the window; hover the stack" bare>
        <ToastsDemo />
      </Specimen>
      <Specimen name="Every toast" bare>
        <div className="flex w-full flex-wrap justify-between gap-8">
          <Column title="Agents">
            <Labeled label="Needs you · stays until answered">
              <Toast {...NEEDS_YOU} />
            </Labeled>
            <Labeled label="Finished">
              <Toast {...DONE} />
            </Labeled>
            <Labeled label="Stopped with an error">
              <Toast {...STOPPED} />
            </Labeled>
          </Column>
          <Column title="Tasks">
            <Labeled label="Long action with progress">
              <Toast {...CREATING} />
            </Labeled>
            <Labeled label="Undoable action · 6s countdown">
              <Toast {...ARCHIVED} />
            </Labeled>
            <Labeled label="Action failed">
              <Toast {...CREATE_FAILED} />
            </Labeled>
          </Column>
          <Column title="Account & app">
            <Labeled label="Usage warning">
              <Toast {...LIMIT} />
            </Labeled>
            <Labeled label="Update ready">
              <Toast {...UPDATE} />
            </Labeled>
          </Column>
        </div>
      </Specimen>
      <Specimen name="Quick confirmations · one line, gone in 2s" bare>
        <div className="flex items-center gap-4">
          <CompactToast {...COPIED} />
          <CompactToast {...PUSHED} />
          <CompactToast {...READ_FAILED} />
        </div>
      </Specimen>
    </Section>
  );
}
