import { notify, notifyCompact } from "@/lib/notify";

const CONTINUE_PROMPT = "Continue where you left off.";
const timers = new Map<string, ReturnType<typeof setTimeout>>();

const clock = (at: Date) => at.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export function remindAtReset(
  task: { id: string; title: string },
  at: Date,
  onOpen: () => void,
): void {
  clearTimeout(timers.get(task.id));
  timers.set(
    task.id,
    setTimeout(
      () => {
        timers.delete(task.id);
        if (!document.hasFocus()) new Notification(`${task.title} can continue`, { silent: true });
        notify({
          tone: "green",
          status: "Limit reset",
          title: task.title,
          body: "Your usage limit has reset.",
          actions: [
            {
              label: "Continue",
              kind: "neutral",
              onClick: () => void window.api.agentSend(task.id, CONTINUE_PROMPT),
            },
            { label: "Open", kind: "ghost", onClick: onOpen },
          ],
        });
      },
      Math.max(0, at.getTime() - Date.now()),
    ),
  );
  notifyCompact({ tone: "green", title: `We’ll let you know at ${clock(at)}` });
}
