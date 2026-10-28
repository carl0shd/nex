import { toast } from "sonner";
import {
  CompactToast,
  Toast,
  type CompactToastProps,
  type ToastAction,
  type ToastProps,
} from "@/components/primitives/toast";

type ToastId = string | number;

interface NotifyOptions {
  id?: ToastId;
  duration?: number;
}

const CONFIRM_MS = 2000;

const dismissing = (actions: readonly ToastAction[] | undefined, id: ToastId) =>
  actions?.map((action) => ({
    ...action,
    onClick: () => {
      action.onClick?.();
      toast.dismiss(id);
    },
  }));

export function notify(props: ToastProps, options: NotifyOptions = {}): ToastId {
  return toast.custom(
    (id) => (
      <Toast
        {...props}
        actions={dismissing(props.actions, id)}
        onDismiss={() => toast.dismiss(id)}
      />
    ),
    { id: options.id, duration: options.duration ?? props.countdown ?? Infinity },
  );
}

export function notifyCompact(props: CompactToastProps, options: NotifyOptions = {}): ToastId {
  return toast.custom(
    (id) => (
      <div className="flex justify-end">
        <CompactToast
          {...props}
          onAction={() => {
            props.onAction?.();
            toast.dismiss(id);
          }}
        />
      </div>
    ),
    { id: options.id, duration: options.duration ?? CONFIRM_MS },
  );
}

export const dismissToast = (id?: ToastId) => toast.dismiss(id);
