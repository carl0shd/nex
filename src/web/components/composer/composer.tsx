import { useEffect, useId, useImperativeHandle, useRef, useState, type Ref } from "react";
import { useHotkey } from "@tanstack/react-hotkeys";
import type { JSONContent } from "@tiptap/react";
import { ArrowUp, Plus } from "lucide-react";
import {
  AddMenu,
  ConnectorAlert,
  ConnectorsMenu,
  type ConnectorGroup,
} from "@/components/composer/add-menu";
import { AttachmentTray, type Attachment } from "@/components/composer/attachments";
import type { ContextUsage } from "@native/agents/context-usage";
import { ContextCard } from "@/components/composer/context-card";
import { ContextRing } from "@/components/composer/context-ring";
import { DictateButton, DictationMenu, DictationText } from "@/components/composer/dictation";
import type { Effort } from "@/components/composer/effort";
import { ModelChip, ModelMenu, type ModelOption } from "@/components/composer/model-menu";
import { MODELS, resolveModel } from "@/components/composer/models";
import {
  PermissionChip,
  PermissionMenu,
  type PermissionMode,
} from "@/components/composer/permission-menu";
import { DropOverlay } from "@/components/composer/drop-overlay";
import { HistoryHint } from "@/components/composer/history-hint";
import { RichEditor, type RichEditorHandle } from "@/components/composer/rich-editor";
import { AnchoredPopover } from "@/components/primitives/anchored-popover";
import { isClickable } from "@/hooks/use-empty-click";
import { useAppHotkey } from "@/hooks/use-app-hotkey";
import { useMicLevel } from "@/hooks/use-mic-level";
import { readDraft, saveDraft } from "@/lib/composer-drafts";
import { suggestedLanguages } from "@/lib/dictation-languages";
import { useDictationStore } from "@/stores/dictation.store";
import { useFileDrop } from "@/hooks/use-file-drop";
import type { SlashCommand, WorktreeFile } from "@/lib/composer-pickers";
import { formatFileSize } from "@/lib/file-size";
import { PERMISSION_MODES, stepPermissionMode } from "@/lib/permission-modes";
import { hotkeyLabel } from "@/lib/shortcut";
import { useTypeToFocus } from "@/hooks/use-type-to-focus";
import { cn } from "@/lib/utils";

type ComposerMenu = "mode" | "model" | "add" | "dictation";

const LONG_MESSAGE_CHARS = 280;
const LONG_MESSAGE_LINES = 4;
const NEW_LINE_KEYS = hotkeyLabel("Shift+Enter");

interface LengthHint {
  chars: number;
  long: boolean;
  shown: boolean;
}

function nextLengthHint(previous: LengthHint, text: string): LengthHint {
  const long = text.length > LONG_MESSAGE_CHARS || text.split("\n").length > LONG_MESSAGE_LINES;
  if (long) return { chars: text.length, long, shown: true };
  return previous.long ? { ...previous, long: false } : previous;
}

function MessageLength({ hint, onHidden }: { hint: LengthHint; onHidden: () => void }) {
  return (
    <span
      aria-hidden={!hint.long}
      onTransitionEnd={() => !hint.long && onHidden()}
      className={cn(
        "pointer-events-none ml-auto min-w-0 truncate pr-1 pl-2 text-2xs text-ink-4 tabular-nums transition-opacity duration-200 ease-out",
        hint.long ? "enter-fade" : "opacity-0",
      )}
    >
      {hint.chars.toLocaleString()} chars · {NEW_LINE_KEYS} new line
    </span>
  );
}

function toAttachment(file: File): Attachment {
  const id = crypto.randomUUID();
  if (file.type.startsWith("image/")) {
    return { id, kind: "image", name: file.name, src: URL.createObjectURL(file), file };
  }
  return { id, kind: "file", name: file.name, size: formatFileSize(file.size), file };
}

function release(attachment: Attachment) {
  if (attachment.kind === "image" && attachment.src?.startsWith("blob:")) {
    URL.revokeObjectURL(attachment.src);
  }
}

function SendButton({
  working,
  onSend,
  onStop,
}: {
  working: boolean;
  onSend?: () => void;
  onStop?: () => void;
}) {
  if (working) {
    return (
      <button
        type="button"
        aria-label="Stop"
        onClick={onStop}
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
      onClick={onSend}
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

export interface PickedPath {
  name: string;
  path: string;
}

export interface ComposerSettings {
  mode: PermissionMode;
  model: string;
  effort: Effort;
}

export interface ComposerHandle {
  focus: () => void;
  replace: (text: string) => void;
  insert: (text: string) => void;
  attach: (files: File[]) => void;
}

export function Composer({
  placeholder,
  defaultMode = "auto",
  defaultModel = "opus-5-5",
  defaultEffort = "high",
  models = MODELS,
  connectors = [],
  files,
  commands,
  defaultAttachments = [],
  defaultContent,
  dictation,
  context,
  state,
  onSubmit,
  onStop,
  onSettingsChange,
  onConnectorToggle,
  onConnectorRetry,
  onConnectorRemove,
  onConnectorsOpen,
  onAddServer,
  onManageConnectors,
  onPickFiles,
  typeToFocus = false,
  history = [],
  draftKey,
  ownDrop = true,
  contextUsage,
  onCompact,
  ref,
}: {
  ownDrop?: boolean;
  draftKey?: string;
  contextUsage?: ContextUsage | null;
  onCompact?: () => void;
  typeToFocus?: boolean;
  history?: readonly string[];
  ref?: Ref<ComposerHandle>;
  onConnectorToggle?: (id: string, enabled: boolean) => void;
  onConnectorRetry?: (id: string) => void;
  onConnectorRemove?: (id: string) => void;
  onConnectorsOpen?: () => void;
  onAddServer?: () => void;
  onManageConnectors?: () => void;
  onPickFiles?: () => Promise<PickedPath[]>;
  placeholder: string;
  defaultMode?: PermissionMode;
  defaultModel?: string;
  defaultEffort?: Effort;
  models?: readonly ModelOption[];
  connectors?: readonly ConnectorGroup[];
  files?: readonly WorktreeFile[];
  commands?: readonly SlashCommand[];
  defaultAttachments?: readonly Attachment[];
  defaultContent?: JSONContent;
  dictation?: { confirmed: string; pending?: string };
  context?: number;
  state: "working" | "idle";
  onSubmit?: (message: { text: string; attachments: Attachment[] }) => void;
  onStop?: () => void;
  onSettingsChange?: (settings: ComposerSettings) => void;
}) {
  const editorRef = useRef<RichEditorHandle>(null);
  useTypeToFocus(typeToFocus, () => editorRef.current?.focus());
  const [historyAt, setHistoryState] = useState<number | null>(null);
  const historyRef = useRef<number | null>(null);
  const setHistoryAt = (index: number | null) => {
    historyRef.current = index;
    setHistoryState(index);
  };
  const browseHistory = (direction: "older" | "newer", text: string): string | null => {
    const at = historyRef.current;
    const browsing = at !== null && text === history[at];
    if (!browsing && text !== "") return null;
    if (direction === "older") {
      const next = browsing ? at - 1 : history.length - 1;
      if (next < 0) return browsing ? text : null;
      setHistoryAt(next);
      return history[next];
    }
    if (!browsing) return null;
    const next = at + 1;
    if (next >= history.length) {
      setHistoryAt(null);
      return "";
    }
    setHistoryAt(next);
    return history[next];
  };
  const stepHistory = (direction: "older" | "newer") => {
    const at = historyRef.current;
    const current = at === null ? "" : history[at];
    const next = browseHistory(direction, current);
    if (next !== null) editorRef.current?.replace(next);
  };
  const rootRef = useRef<HTMLDivElement>(null);
  const [mode, setModeState] = useState(defaultMode);
  const [syncedMode, setSyncedMode] = useState(defaultMode);
  if (defaultMode !== syncedMode) {
    setSyncedMode(defaultMode);
    setModeState(defaultMode);
  }
  const [model, setModelState] = useState(defaultModel);
  const [effort, setEffortState] = useState(defaultEffort);
  const change = (next: Partial<ComposerSettings>) =>
    onSettingsChange?.({ mode, model, effort, ...next });
  const setMode = (next: PermissionMode) => {
    setModeState(next);
    change({ mode: next });
  };
  const setModel = (next: string) => {
    setModelState(next);
    change({ model: next });
  };
  const setEffort = (next: Effort) => {
    setEffortState(next);
    change({ effort: next });
  };
  const [menu, setMenu] = useState<ComposerMenu | null>(null);
  const [lengthHint, setLengthHint] = useState<LengthHint>({
    chars: 0,
    long: false,
    shown: false,
  });
  const [connectorsOpen, setConnectorsOpen] = useState(false);
  const [connectorQuery, setConnectorQuery] = useState("");
  const [localGroups, setGroups] = useState(connectors);
  const groups = onConnectorToggle ? connectors : localGroups;

  const [languageQuery, setLanguageQuery] = useState("");
  const dictationOwner = useId();
  const dictating = useDictationStore((s) => s.owner === dictationOwner);
  const micStarting = useDictationStore((s) => s.owner === dictationOwner && !s.micReady);
  const dictationPending = useDictationStore((s) => (s.owner === dictationOwner ? s.pending : ""));
  const dictationLanguages = useDictationStore((s) => s.languages);
  const dictationMicrophones = useDictationStore((s) => s.microphones);
  const dictationPrefs = useDictationStore((s) => s.prefs);
  const loadDictation = useDictationStore((s) => s.load);
  const startDictation = useDictationStore((s) => s.start);
  const stopDictation = useDictationStore((s) => s.stop);
  const setDictationLanguage = useDictationStore((s) => s.setLanguage);
  const setDictationMicrophone = useDictationStore((s) => s.setMicrophone);
  const toggleDictation = () =>
    dictating
      ? stopDictation(dictationOwner)
      : void startDictation(dictationOwner, (text) => editorRef.current?.append(text));
  const listening = dictation ? Boolean(dictation.pending) : dictating;
  useAppHotkey("dictate", toggleDictation, typeToFocus);
  useMicLevel(
    dictationMicrophones.find((input) => input.id === dictationPrefs.microphone)?.name,
    menu === "dictation" && !dictating,
  );
  const [draft] = useState(() => (draftKey ? readDraft(draftKey) : undefined));
  const [attachments, setAttachments] = useState<Attachment[]>(
    () => draft?.attachments ?? [...defaultAttachments],
  );
  useEffect(() => {
    if (draftKey) saveDraft(draftKey, { attachments });
  }, [draftKey, attachments]);
  const addPaths = (paths: readonly PickedPath[]) =>
    setAttachments((previous) => [
      ...previous,
      ...paths.map((picked) => ({
        id: crypto.randomUUID(),
        kind: "file" as const,
        name: picked.name,
        size: "",
        path: picked.path,
      })),
    ]);
  const closeMenu = () => {
    setMenu(null);
    setConnectorsOpen(false);
  };
  const addFiles = () => {
    closeMenu();
    void onPickFiles?.().then(addPaths);
  };
  useHotkey("Mod+U", addFiles, { target: rootRef, enabled: Boolean(onPickFiles) });
  const attachFiles = (dropped: File[]) =>
    setAttachments((previous) => [...previous, ...dropped.map(toAttachment)]);
  const { dragging, dropHandlers } = useFileDrop(attachFiles);
  useImperativeHandle(ref, () => ({
    focus: () => editorRef.current?.focus(),
    replace: (text: string) => editorRef.current?.replace(text),
    insert: (text: string) => editorRef.current?.insert(text),
    attach: (files: File[]) => attachFiles(files),
  }));

  const allConnectors = groups.flatMap((group) => group.connectors);
  const failed = allConnectors.filter((connector) => connector.failed).length;
  const enabled = allConnectors.filter((connector) => connector.enabled).length;
  const current = resolveModel(models, model) ?? models[0];
  const modes =
    current?.autoMode === false
      ? PERMISSION_MODES.filter((option) => option !== "auto")
      : PERMISSION_MODES;
  const modeMenuOpen = menu === "mode";
  useHotkey("Shift+Tab", () => setMode(stepPermissionMode(mode, 1, modes)), {
    target: rootRef,
    ignoreInputs: false,
  });
  useHotkey("Mod+ArrowRight", () => setMode(stepPermissionMode(mode, 1, modes)), {
    target: rootRef,
    enabled: modeMenuOpen,
  });
  useHotkey("Mod+ArrowLeft", () => setMode(stepPermissionMode(mode, -1, modes)), {
    target: rootRef,
    enabled: modeMenuOpen,
  });

  const menuProps = (name: ComposerMenu) => ({
    strategy: "fixed" as const,
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
      ref={rootRef}
      {...(ownDrop ? dropHandlers : {})}
      onMouseDown={(event) => {
        if (isClickable(event.target)) return;
        event.preventDefault();
        editorRef.current?.focus();
      }}
      className="relative mx-2 mb-2 flex shrink-0 cursor-text flex-col rounded-panel bg-surface-raised shadow-[0_0_0_1px_var(--line-strong)]"
    >
      {historyAt !== null && (
        <HistoryHint
          position={history.length - historyAt}
          total={history.length}
          onOlder={() => stepHistory("older")}
          onNewer={() => stepHistory("newer")}
        />
      )}
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
          ref={editorRef}
          placeholder={attachments.length ? "Add a message…" : placeholder}
          defaultContent={draft?.content ?? defaultContent}
          onContentChange={(content) => {
            if (draftKey) saveDraft(draftKey, { content });
          }}
          files={files}
          commands={commands}
          onAttachFiles={attachFiles}
          onHistory={browseHistory}
          ghostText={dictationPending}
          onTextChange={(text) => {
            setLengthHint((previous) => nextLengthHint(previous, text));
            const at = historyRef.current;
            if (at !== null && text !== history[at]) setHistoryAt(null);
          }}
          onPasteText={(text) =>
            setAttachments((previous) => [
              ...previous,
              {
                id: crypto.randomUUID(),
                kind: "text",
                name: "Pasted text",
                lines: text.split("\n").length,
                content: text,
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
          <PermissionMenu mode={mode} modes={modes} onChange={setMode} defaultMode={defaultMode} />
        </AnchoredPopover>
        <AnchoredPopover
          {...menuProps("model")}
          trigger={
            <ModelChip
              model={current.short}
              effort={current.efforts?.length === 0 ? null : effort}
              open={menu === "model"}
              onClick={toggle("model")}
            />
          }
        >
          <ModelMenu
            models={models}
            model={current?.id ?? model}
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
            onConnectorsOpenChange={(next) => {
              setConnectorsOpen(next);
              if (next) onConnectorsOpen?.();
            }}
            onAddFiles={onPickFiles && addFiles}
            onMention={() => {
              closeMenu();
              editorRef.current?.insert("@");
            }}
            onCommands={() => {
              closeMenu();
              editorRef.current?.insert("/", "start");
            }}
          >
            <ConnectorsMenu
              groups={groups}
              query={connectorQuery}
              onQueryChange={setConnectorQuery}
              onToggle={(id, on) =>
                onConnectorToggle ? onConnectorToggle(id, on) : updateConnector(id, { enabled: on })
              }
              onRetry={(id) =>
                onConnectorRetry
                  ? onConnectorRetry(id)
                  : updateConnector(id, { failed: false, enabled: true })
              }
              onRemove={onConnectorRemove}
              onAddServer={
                onAddServer &&
                (() => {
                  closeMenu();
                  onAddServer();
                })
              }
              onManage={
                onManageConnectors &&
                (() => {
                  closeMenu();
                  onManageConnectors();
                })
              }
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
        {lengthHint.shown && (
          <MessageLength
            hint={lengthHint}
            onHidden={() => setLengthHint((previous) => ({ ...previous, shown: false }))}
          />
        )}
        <span className={cn("flex items-center gap-1", !lengthHint.shown && "ml-auto")}>
          {(contextUsage || context !== undefined) && (
            <ContextRing
              percent={contextUsage?.percent ?? context ?? 0}
              card={
                contextUsage
                  ? (close) => (
                      <ContextCard
                        usage={contextUsage}
                        onCompact={
                          onCompact &&
                          (() => {
                            close();
                            onCompact();
                          })
                        }
                      />
                    )
                  : undefined
              }
            />
          )}
          <AnchoredPopover
            {...menuProps("dictation")}
            align="end"
            trigger={
              <DictateButton
                listening={listening}
                starting={micStarting}
                live={dictating}
                menuOpen={menu === "dictation"}
                onDictate={() => {
                  toggleDictation();
                  if (menu === "dictation") setMenu(null);
                }}
                onMenuOpenChange={(open) => {
                  if (open) {
                    loadDictation();
                    setLanguageQuery("");
                  }
                  menuProps("dictation").onOpenChange(open);
                }}
              />
            }
          >
            <DictationMenu
              languages={dictationLanguages}
              suggested={suggestedLanguages(
                dictationLanguages,
                dictationPrefs.recent,
                navigator.languages,
              )}
              language={dictationPrefs.language}
              onLanguageChange={setDictationLanguage}
              microphones={dictationMicrophones}
              microphone={dictationPrefs.microphone}
              onMicrophoneChange={setDictationMicrophone}
              live
              query={languageQuery}
              onQueryChange={setLanguageQuery}
            />
          </AnchoredPopover>
          <SendButton
            working={state === "working"}
            onSend={() => editorRef.current?.submit()}
            onStop={onStop}
          />
        </span>
      </div>
      {dragging && <DropOverlay images={dragging.images} files={dragging.files} />}
    </div>
  );
}
