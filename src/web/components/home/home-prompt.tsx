import { useState, type CSSProperties } from "react";
import { AttachmentTray, type Attachment } from "@/components/composer/attachments";
import { DropOverlay } from "@/components/composer/drop-overlay";
import { DetailsEditor } from "@/components/new-task/details-editor";
import { StartTaskButton } from "@/components/new-task/start-task-button";
import { TaskFieldRows } from "@/components/new-task/task-field-pills";
import { useTaskFields, type NewTaskDraft, type TaskFieldOptions } from "@/hooks/use-task-fields";
import { useFileDrop } from "@/hooks/use-file-drop";
import { fileAttachment, releaseAttachment } from "@/lib/attachments";
import { cn } from "@/lib/utils";

export function HomePrompt({
  starting = false,
  autoFocus = false,
  onStart,
  onAddProject,
  className,
  style,
  ...options
}: TaskFieldOptions & {
  starting?: boolean;
  autoFocus?: boolean;
  onStart?: (draft: NewTaskDraft) => Promise<boolean> | void;
  onAddProject?: () => void;
  className?: string;
  style?: CSSProperties;
}) {
  const fields = useTaskFields(options);
  const [text, setText] = useState("");
  const [cleared, setCleared] = useState(0);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const attach = (files: File[]) =>
    setAttachments((previous) => [...previous, ...files.map(fileAttachment)]);
  const { dragging, dropHandlers } = useFileDrop(attach);
  const ready =
    (text.length > 0 || attachments.length > 0 || Boolean(fields.resume)) &&
    Boolean(fields.current) &&
    !starting;
  const placeholder = fields.current
    ? `Describe a task for ${fields.current.name}`
    : "Add a project to start a task";
  const submit = async () => {
    if (!ready) return;
    const title = text.split("\n")[0]?.trim() || fields.resume?.title || attachments[0]?.name || "";
    if (!(await onStart?.(fields.draft(title, text, attachments)))) return;
    attachments.forEach(releaseAttachment);
    setAttachments([]);
    setText("");
    setCleared((count) => count + 1);
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
      {...dropHandlers}
      style={style}
      className={cn(
        "rise-in-glass-fade relative flex w-full flex-col rounded-sheet bg-surface-glass px-3.5 pt-4 pb-3.5 text-left shadow-modal backdrop-blur-[28px] backdrop-saturate-[1.2]",
        className,
      )}
    >
      <AttachmentTray
        attachments={attachments}
        onRemove={(id) =>
          setAttachments((previous) => {
            previous.filter((item) => item.id === id).forEach(releaseAttachment);
            return previous.filter((item) => item.id !== id);
          })
        }
      />
      <DetailsEditor
        key={cleared}
        variant="prompt"
        label="New task"
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={starting}
        onChange={setText}
        onSubmit={() => void submit()}
        onFiles={attach}
        className="min-h-12 px-1.5 py-2.5"
      />
      <TaskFieldRows
        fields={fields}
        disabled={starting}
        onAddProject={onAddProject}
        className="mt-4"
        action={<StartTaskButton type="submit" ready={ready} starting={starting} />}
      />
      {dragging && <DropOverlay images={dragging.images} files={dragging.files} />}
    </form>
  );
}
