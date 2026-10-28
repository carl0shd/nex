import { useState } from "react";
import type { JSONContent } from "@tiptap/react";
import { ArrowUp, Plus } from "iconoir-react";
import {
  AddMenu,
  ConnectorAlert,
  ConnectorsMenu,
  type ConnectorGroup,
} from "@/components/composer/add-menu";
import { AttachmentTray, type Attachment } from "@/components/composer/attachments";
import { ContextRing } from "@/components/composer/context-ring";
import {
  DictateButton,
  DictationMenu,
  DictationText,
  type DictationLanguage,
  type MicrophoneInput,
} from "@/components/composer/dictation";
import type { Effort } from "@/components/composer/effort";
import { ModelChip, ModelMenu, type ModelOption } from "@/components/composer/model-menu";
import { MODELS } from "@/components/composer/models";
import {
  PermissionChip,
  PermissionMenu,
  type PermissionMode,
} from "@/components/composer/permission-menu";
import { DropOverlay } from "@/components/composer/drop-overlay";
import { RichEditor } from "@/components/composer/rich-editor";
import { AnchoredPopover } from "@/components/primitives/anchored-popover";
import { useFileDrop } from "@/hooks/use-file-drop";
import type { SlashCommand, WorktreeFile } from "@/lib/composer-pickers";
import { formatFileSize } from "@/lib/file-size";
import { cn } from "@/lib/utils";

type ComposerMenu = "mode" | "model" | "add" | "dictation";

function toAttachment(file: File): Attachment {
  const id = crypto.randomUUID();
  if (file.type.startsWith("image/")) {
    return { id, kind: "image", name: file.name, src: URL.createObjectURL(file) };
  }
  return { id, kind: "file", name: file.name, size: formatFileSize(file.size) };
}

function release(attachment: Attachment) {
  if (attachment.kind === "image" && attachment.src?.startsWith("blob:")) {
    URL.revokeObjectURL(attachment.src);
  }
}

function SendButton({ working }: { working: boolean }) {
  if (working) {
    return (
      <button
        type="button"
        aria-label="Stop"
        className="interactive press flex size-[30px] cursor-pointer items-center justify-center rounded-full bg-ink select-none"
      >
        <span className="size-[9px] rounded-[2px] bg-inverse" />
      </button>
    );
  }
  return (
    <button
      type="button"
      aria-label="Send"
      className="interactive press flex size-[30px] cursor-pointer items-center justify-center rounded-full bg-accent text-on-accent select-none hover:bg-accent-hover"
    >
      <ArrowUp width={14} height={14} strokeWidth={2.5} />
    </button>
  );
}

function AddButton({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Add"
      aria-expanded={open}
      onClick={onClick}
      className={cn(
        "interactive press flex size-7 cursor-pointer items-center justify-center rounded-full select-none",
        open ? "bg-line-strong text-ink" : "text-ink-3 hover:bg-hover hover:text-ink-2",
      )}
    >
      <Plus width={15} height={15} strokeWidth={2.25} />
    </button>
  );
}

export function Composer({
  placeholder,
  defaultMode = "auto",
  defaultModel = "opus-5-5",
  defaultEffort = "high",
  models = MODELS,
  connectors = [],
  languages = [],
  microphones = [],
  files,
  commands,
  defaultAttachments = [],
  defaultContent,
  dictation,
  context,
  state,
  onSubmit,
}: {
  placeholder: string;
  defaultMode?: PermissionMode;
  defaultModel?: string;
  defaultEffort?: Effort;
  models?: readonly ModelOption[];
  connectors?: readonly ConnectorGroup[];
  languages?: readonly DictationLanguage[];
  microphones?: readonly MicrophoneInput[];
  files?: readonly WorktreeFile[];
  commands?: readonly SlashCommand[];
  defaultAttachments?: readonly Attachment[];
  defaultContent?: JSONContent;
  dictation?: { confirmed: string; pending?: string };
  context?: number;
  state: "working" | "idle";
  onSubmit?: (message: { text: string; attachments: Attachment[] }) => void;
}) {
  const [mode, setMode] = useState(defaultMode);
  const [model, setModel] = useState(defaultModel);
  const [effort, setEffort] = useState(defaultEffort);
  const [menu, setMenu] = useState<ComposerMenu | null>(null);
  const [connectorsOpen, setConnectorsOpen] = useState(false);
  const [connectorQuery, setConnectorQuery] = useState("");
  const [groups, setGroups] = useState(connectors);
  const [language, setLanguage] = useState(languages[0]?.id ?? "");
  const [languageQuery, setLanguageQuery] = useState("");
  const [microphone, setMicrophone] = useState(microphones[0]?.id ?? "");
  const [listening, setListening] = useState(Boolean(dictation?.pending));
  const [attachments, setAttachments] = useState<Attachment[]>([...defaultAttachments]);
  const attachFiles = (dropped: File[]) =>
    setAttachments((previous) => [...previous, ...dropped.map(toAttachment)]);
  const { dragging, dropHandlers } = useFileDrop(attachFiles);

  const allConnectors = groups.flatMap((group) => group.connectors);
  const failed = allConnectors.filter((connector) => connector.failed).length;
  const enabled = allConnectors.filter((connector) => connector.enabled).length;
  const current = models.find((option) => option.id === model) ?? models[0];

  const menuProps = (name: ComposerMenu) => ({
    open: menu === name,
    onOpenChange: (open: boolean) => {
      setMenu(open ? name : null);
      if (!open) setConnectorsOpen(false);
    },
  });
  const toggle = (name: ComposerMenu) => () => menuProps(name).onOpenChange(menu !== name);
  const updateConnector = (id: string, change: { enabled?: boolean; failed?: boolean }) =>
    setGroups((previous) =>
      previous.map((group) => ({
        ...group,
        connectors: group.connectors.map((connector) =>
          connector.id === id ? { ...connector, ...change } : connector,
        ),
      })),
    );

  return (
    <div
      {...dropHandlers}
      className="relative mx-2 mb-2 flex shrink-0 flex-col rounded-panel bg-surface-raised shadow-[0_0_0_1px_var(--line-strong)]"
    >
      <AttachmentTray
        attachments={attachments}
        onRemove={(id) =>
          setAttachments((previous) => {
            previous.filter((attachment) => attachment.id === id).forEach(release);
            return previous.filter((attachment) => attachment.id !== id);
          })
        }
      />
      {dictation ? (
        <div className="px-3.5 pt-3 pb-1 text-sm leading-6 text-ink">
          <DictationText
            confirmed={dictation.confirmed}
            pending={listening ? dictation.pending : undefined}
          />
        </div>
      ) : (
        <RichEditor
          placeholder={attachments.length ? "Add a message…" : placeholder}
          defaultContent={defaultContent}
          files={files}
          commands={commands}
          onAttachFiles={attachFiles}
          onPasteText={(text) =>
            setAttachments((previous) => [
              ...previous,
              {
                id: crypto.randomUUID(),
                kind: "text",
                name: "Pasted text",
                lines: text.split("\n").length,
              },
            ])
          }
          onSubmit={(text) => {
            onSubmit?.({ text, attachments });
            attachments.forEach(release);
            setAttachments([]);
          }}
        />
      )}
      <div className="flex h-11 items-center gap-1.5 px-2">
        <AnchoredPopover
          {...menuProps("mode")}
          trigger={<PermissionChip mode={mode} open={menu === "mode"} onClick={toggle("mode")} />}
        >
          <PermissionMenu mode={mode} onChange={setMode} defaultMode={defaultMode} />
        </AnchoredPopover>
        <AnchoredPopover
          {...menuProps("model")}
          trigger={
            <ModelChip
              model={current.short}
              effort={effort}
              open={menu === "model"}
              onClick={toggle("model")}
            />
          }
        >
          <ModelMenu
            models={models}
            model={model}
            onModelChange={setModel}
            effort={effort}
            onEffortChange={setEffort}
          />
        </AnchoredPopover>
        <AnchoredPopover
          {...menuProps("add")}
          trigger={<AddButton open={menu === "add"} onClick={toggle("add")} />}
        >
          <AddMenu
            connectorCount={enabled}
            connectorsOpen={connectorsOpen}
            onConnectorsOpenChange={setConnectorsOpen}
          >
            <ConnectorsMenu
              groups={groups}
              query={connectorQuery}
              onQueryChange={setConnectorQuery}
              onToggle={(id, on) => updateConnector(id, { enabled: on })}
              onRetry={(id) => updateConnector(id, { failed: false, enabled: true })}
            />
          </AddMenu>
        </AnchoredPopover>
        {failed > 0 && (
          <ConnectorAlert
            count={failed}
            onClick={() => {
              setMenu("add");
              setConnectorsOpen(true);
            }}
          />
        )}
        <span className="ml-auto flex items-center gap-1">
          {context !== undefined && <ContextRing percent={context} />}
          <AnchoredPopover
            {...menuProps("dictation")}
            align="end"
            trigger={
              <DictateButton
                listening={listening}
                menuOpen={menu === "dictation"}
                onDictate={() => {
                  setListening((value) => !value);
                  if (menu === "dictation") setMenu(null);
                }}
                onMenuOpenChange={(open) => menuProps("dictation").onOpenChange(open)}
              />
            }
          >
            <DictationMenu
              languages={languages}
              language={language}
              onLanguageChange={setLanguage}
              microphones={microphones}
              microphone={microphone}
              onMicrophoneChange={setMicrophone}
              query={languageQuery}
              onQueryChange={setLanguageQuery}
            />
          </AnchoredPopover>
          <SendButton working={state === "working"} />
        </span>
      </div>
      {dragging && <DropOverlay images={dragging.images} files={dragging.files} />}
    </div>
  );
}
