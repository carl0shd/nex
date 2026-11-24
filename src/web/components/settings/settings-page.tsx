import { useHotkey } from "@tanstack/react-hotkeys";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Monitor, Moon, Play, Plus, Sun } from "lucide-react";
import type { Preferences } from "@native/db/types";
import { ClaudeTile } from "@/components/atoms/agent-tile";
import { SetupProgress, type SetupProgressPhase } from "@/components/environment/setup-progress";
import type { CheckItem } from "@/components/onboarding/check-list";
import { Button } from "@/components/atoms/button";
import { DitherStars } from "@/components/atoms/dither-stars";
import { IconButton } from "@/components/atoms/icon-button";
import { KeyCaps } from "@/components/atoms/kbd";
import { NexLogo } from "@/components/atoms/nex-logo";
import { SearchField } from "@/components/atoms/search-field";
import { SegmentedControl } from "@/components/atoms/segmented-control";
import { TextField } from "@/components/atoms/text-field";
import GlideMenu from "@/components/primitives/glide-menu";
import { Overlay } from "@/components/primitives/overlay";
import { SelectMenu, type SelectOption } from "@/components/primitives/select-menu";
import {
  SettingRow,
  SettingSwitchRow,
  SettingsCard,
  SettingsGroupHeader,
} from "@/components/primitives/setting-row";
import {
  AccountList,
  RemoveAccountDialog,
  type ClaudeAccount,
} from "@/components/settings/account-list";
import {
  LicenseSheet,
  LicensesView,
  type PackageLicense,
} from "@/components/settings/licenses-view";
import { RemoveEnvironmentsDialog } from "@/components/settings/remove-environments-dialog";
import { RuntimeCard, type RuntimeStatus } from "@/components/settings/runtime-card";
import { SettingsIndex, type SettingsIndexGroup } from "@/components/settings/settings-index";
import { SettingsSection } from "@/components/settings/settings-section";
import * as OPTIONS from "@/components/settings/settings-values";
import { ShortcutRow } from "@/components/settings/shortcut-row";
import { WorkspaceCard, type SettingsWorkspace } from "@/components/settings/workspace-card";
import { ImportRepoButton } from "@/components/settings/import-repo-button";
import type { WorkspaceLookChange } from "@/components/sidebar/workspace-header";
import { DEFAULT_SHORTCUTS, shortcutConflict, type ShortcutId } from "@/lib/app-shortcuts";
import { hotkeyCaps } from "@/lib/shortcut";
import { MIN_CLAUDE_VERSION, type ClaudeCompat } from "@/lib/claude-version";
import { filterSections } from "@/lib/settings-search";
import type { ThemePreference } from "@/lib/theme";
import { cn } from "@/lib/utils";

interface Block {
  key: string;
  keywords: string[];
  node: ReactNode;
}

interface Group {
  key: string;
  label?: ReactNode;
  trailing?: ReactNode;
  card: boolean;
  blocks: Block[];
}

interface Section {
  id: string;
  title: string;
  description: string;
  part: "general" | "work" | "nex";
  groups: Group[];
}

export interface SettingsEnvironmentSetup {
  items: readonly CheckItem[];
  current: number;
  phase: SetupProgressPhase;
  leftLabel?: string;
  took?: string;
  error?: string;
}

export interface SettingsEnvironments {
  unsupported: { title: string; description: string } | null;
  enabled: boolean;
  runtime: RuntimeStatus;
  containers: number;
  memory: string;
  memoryOptions: readonly SelectOption<string>[];
  setup: SettingsEnvironmentSetup | null;
  removesRuntime: boolean;
  removing: boolean;
}

export interface SettingsData {
  version: string;
  dataDir: string;
  openAtLogin: boolean;
  theme: ThemePreference;
  showSidebar: boolean;
  accounts: readonly ClaudeAccount[];
  workspaces: readonly SettingsWorkspace[];
  claudeCode: { version: string; path: string; compat: ClaudeCompat; upgrading: boolean } | null;
  claudePathChangeable: boolean;
  models: readonly SelectOption<string>[];
  model: string;
  licenses: readonly PackageLicense[];
  ides: readonly string[];
  terminals: readonly string[];
  shells: readonly string[];
  microphones: readonly SelectOption<string>[];
  languages: readonly SelectOption<string>[];
  microphone: string;
  language: string;
  lastScan: string;
  environments: SettingsEnvironments | null;
}

export interface SettingsActions {
  onPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  onOpenAtLogin: (openAtLogin: boolean) => void;
  onTheme: (theme: ThemePreference) => void;
  onShowSidebar: (show: boolean) => void;
  onMakeDefault: (accountId: string) => void;
  onShowProfile: (accountId: string) => void;
  onRenameAccount: (accountId: string, name: string) => void;
  onRemoveAccount: (accountId: string) => void;
  onAddAccount: () => void;
  onSignInAgain: (accountId: string) => void;
  onOpenProject: (projectId: string) => void;
  onAddProject: (workspaceId: string) => void;
  onImportFromGitHub: (workspaceId: string) => void;
  onAddWorkspace: () => void;
  onRenameWorkspace: (workspaceId: string, name: string) => void;
  onWorkspaceLookChange: (workspaceId: string, look: WorkspaceLookChange) => void;
  onWorkspaceHiddenChange: (workspaceId: string, hidden: boolean) => void;
  onRemoveWorkspace: (workspaceId: string) => void;
  onChangeClaudePath: () => void;
  onPlaySound: (sound: string) => void;
  onMicrophone: (microphone: string) => void;
  onLanguage: (language: string) => void;
  onRescan: () => void;
  onUpgradeClaude: () => void;
  onShowDataFolder: () => void;
  onSetUpEnvironments: () => void;
  onShowEnvironmentLog: () => void;
  onRestartEnvironments: () => void;
  onRepairAddresses: () => void;
  onEnvironmentMemory: (memory: string) => void;
  onRemoveEnvironments: () => Promise<void>;
}

type SelectKey = {
  [K in keyof Preferences]: Preferences[K] extends string ? K : never;
}[keyof Preferences];

const PARTS: { id: Section["part"]; label: string }[] = [
  { id: "general", label: "General" },
  { id: "work", label: "Work" },
  { id: "nex", label: "Nex" },
];

const LISTED_SHORTCUTS: readonly ShortcutId[] = [
  "new-task",
  "palette",
  "overview",
  "next",
  "previous",
  "tasks",
  "views",
  "dictate",
  "usage",
  "workspace",
  "sidebar",
];

const SYSTEM_SHELL = "";

const COMPAT_NOTE: Record<ClaudeCompat, string> = {
  ok: "",
  outdated: ` · Nex needs v${MIN_CLAUDE_VERSION} or newer`,
  newer: " · newer than the version Nex was tested with",
};

const row = (label: string, description: string | undefined, control: ReactNode): Block => ({
  key: label,
  keywords: description ? [label, description] : [label],
  node: <SettingRow label={label} description={description} control={control} />,
});

const switchRow = (
  label: string,
  description: string | undefined,
  checked: boolean,
  onChange: (checked: boolean) => void,
): Block => ({
  key: label,
  keywords: description ? [label, description] : [label],
  node: (
    <SettingSwitchRow
      label={label}
      description={description}
      checked={checked}
      onChange={onChange}
    />
  ),
});

const custom = (key: string, keywords: string[], node: ReactNode): Block => ({
  key,
  keywords,
  node,
});

const card = (key: string, blocks: Block[], label?: string, trailing?: ReactNode): Group => ({
  key,
  label,
  trailing,
  card: true,
  blocks,
});

const appOptions = (installed: readonly string[], current: string) =>
  (installed.length > 0 ? installed : [current]).map((app) => ({ value: app, label: app }));

function Field({
  label,
  value,
  placeholder,
  width = 200,
  readOnly = false,
  mono = false,
  onCommit,
}: {
  label: string;
  value: string;
  placeholder?: string;
  width?: number;
  readOnly?: boolean;
  mono?: boolean;
  onCommit?: (value: string) => void;
}) {
  return (
    <span style={{ width }}>
      <TextField
        key={value}
        defaultValue={value}
        placeholder={placeholder}
        readOnly={readOnly}
        title={readOnly ? value : undefined}
        aria-label={label}
        mono={mono}
        size="md"
        className="h-[30px] rounded-control text-xs"
        onBlur={(event) => {
          const next = event.currentTarget.value.trim();
          if (next !== value) onCommit?.(next);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
      />
    </span>
  );
}

const FOLLOW_SECTION_MS = 4000;
const SETTLE_QUIET_MS = 120;
const SETTLE_MAX_MS = 700;
const STOP_FOLLOWING = ["wheel", "pointerdown", "keydown"] as const;

function scrollToSection(root: HTMLElement | null, id: string, behavior: ScrollBehavior) {
  const section = root?.querySelector<HTMLElement>(`[data-settings-section="${id}"]`);
  if (!root || !section) return false;
  root.scrollTo({ top: section.offsetTop - 24, behavior });
  return true;
}

function environmentGroups(
  env: SettingsEnvironments,
  values: Preferences,
  actions: SettingsActions,
  select: (key: SelectKey, options: readonly SelectOption<string>[]) => ReactNode,
  onUninstall: () => void,
): Group[] {
  if (env.unsupported) {
    return [
      card("env-unsupported", [row(env.unsupported.title, env.unsupported.description, null)]),
    ];
  }
  const memory = row(
    "Memory for environments",
    "Shared by every task. New environments wait when it is full.",
    <SelectMenu
      value={env.memory}
      options={env.memoryOptions}
      onChange={actions.onEnvironmentMemory}
      className="w-[90px] min-w-0"
    />,
  );
  if (!env.enabled) {
    const { setup } = env;
    return [
      ...(setup
        ? [
            {
              key: "env-progress",
              card: false,
              blocks: [
                custom(
                  "env-progress",
                  ["Set up environments", ...setup.items.map((item) => item.label)],
                  <SetupProgress
                    items={setup.items}
                    current={setup.current}
                    phase={setup.phase}
                    leftLabel={setup.leftLabel}
                    took={setup.took}
                  />,
                ),
              ],
            },
          ]
        : []),
      card("env-setup", [
        memory,
        row(
          setup?.phase === "failed" ? "Setup stopped" : "Set up environments",
          setup?.error ?? "Installs Apple container and registers .nex addresses on this Mac.",
          <>
            {setup && (
              <Button variant="quiet" size="sm" onClick={actions.onShowEnvironmentLog}>
                Show log
              </Button>
            )}
            <Button
              size="sm"
              disabled={setup?.phase === "running"}
              onClick={actions.onSetUpEnvironments}
            >
              {setup?.phase === "running"
                ? "Setting up…"
                : setup?.phase === "failed"
                  ? "Try again"
                  : "Set up"}
            </Button>
          </>,
        ),
      ]),
    ];
  }
  return [
    {
      key: "env-runtime",
      card: false,
      blocks: [
        custom(
          "runtime",
          ["Apple container", "Restart", "Repair", ".nex addresses", env.runtime.version ?? ""],
          <RuntimeCard
            runtime={env.runtime}
            onRestart={actions.onRestartEnvironments}
            onRepair={actions.onRepairAddresses}
          />,
        ),
      ],
    },
    card(
      "env-behaviour",
      [
        memory,
        row(
          "Run at most",
          "New tasks wait for room once this many are running.",
          select("envRunAtMost", OPTIONS.RUN_AT_MOST),
        ),
        row(
          "Pause idle environments after",
          "Frees memory. They resume when you open the task.",
          select("envPauseAfter", OPTIONS.PAUSE_AFTER),
        ),
        switchRow(
          "Start when a task is created",
          "Otherwise it starts the first time you open the task.",
          values.envStartOnCreate,
          (checked) => actions.onPreference("envStartOnCreate", checked),
        ),
      ],
      "Behaviour",
    ),
    card("env-remove", [
      row(
        "Remove environments",
        "Deletes every environment Nex created. Projects are not touched.",
        <Button variant="destructive" size="sm" onClick={onUninstall}>
          Uninstall…
        </Button>,
      ),
    ]),
  ];
}

export function SettingsPage({
  values,
  data,
  actions,
  initialSection,
  className,
}: {
  values: Preferences;
  data: SettingsData;
  actions: SettingsActions;
  initialSection?: { id: string; request: string };
  className?: string;
}) {
  const [removing, setRemoving] = useState<ClaudeAccount | null>(null);
  const [uninstalling, setUninstalling] = useState(false);
  const [view, setView] = useState<"settings" | "licenses">("settings");
  const [license, setLicense] = useState<PackageLicense | null>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("general");
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const settingsScroll = useRef(0);
  useLayoutEffect(() => {
    const root = scrollRef.current;
    if (root) root.scrollTop = view === "licenses" ? 0 : settingsScroll.current;
  }, [view]);
  const showLicenses = () => {
    settingsScroll.current = scrollRef.current?.scrollTop ?? 0;
    setView("licenses");
  };
  const set =
    <K extends keyof Preferences>(key: K) =>
    (value: Preferences[K]) =>
      actions.onPreference(key, value);

  const select = (
    key: SelectKey,
    options: readonly SelectOption<string>[],
    { width, mono = false }: { width?: string; mono?: boolean } = {},
  ) => (
    <SelectMenu
      value={values[key] as string}
      options={options}
      mono={mono}
      onChange={(value) => actions.onPreference(key, value as never)}
      className={width && cn("min-w-0", width)}
    />
  );

  const allShortcuts = DEFAULT_SHORTCUTS.map((shortcut) => ({
    ...shortcut,
    hotkey: values.shortcuts[shortcut.id] ?? shortcut.hotkey,
  }));
  const shortcuts = allShortcuts.filter((shortcut) => LISTED_SHORTCUTS.includes(shortcut.id));
  const dictateKeys = hotkeyCaps(
    shortcuts.find((shortcut) => shortcut.id === "dictate")?.hotkey ?? "",
  );
  const fallback = data.accounts.find(
    (account) => account.isDefault && account.id !== removing?.id,
  );
  const shellOptions = [
    { value: SYSTEM_SHELL, label: "Login shell" },
    ...data.shells.map((shell) => ({ value: shell, label: shell })),
  ];

  const sections: Section[] = [
    {
      id: "general",
      title: "General",
      description: "How Nex starts, quits and hands off to your other apps.",
      part: "general",
      groups: [
        card("general", [
          switchRow(
            "Open at login",
            "Start Nex when you sign in to your Mac.",
            data.openAtLogin,
            actions.onOpenAtLogin,
          ),
          row(
            "Open in IDE",
            "The editor a task opens in from its menu.",
            select("ide", appOptions(data.ides, values.ide)),
          ),
          row(
            "Open in terminal",
            "The terminal app a task opens in from its menu.",
            select("terminalApp", appOptions(data.terminals, values.terminalApp)),
          ),
          row(
            "When you quit with agents working",
            "Quitting stops every agent Nex started.",
            <SegmentedControl
              options={["ask", "quit"] as const}
              labels={{ ask: "Ask first", quit: "Quit anyway" }}
              value={values.quitWithAgents}
              onChange={set("quitWithAgents")}
            />,
          ),
          switchRow(
            "Confirm before closing a task",
            "Tasks with uncommitted changes always ask.",
            values.confirmClose,
            set("confirmClose"),
          ),
        ]),
      ],
    },
    {
      id: "appearance",
      title: "Appearance",
      description: "Theme, type and how much the app moves.",
      part: "general",
      groups: [
        card("appearance", [
          row(
            "Theme",
            "System follows your Mac’s appearance.",
            <SegmentedControl
              options={["system", "dark", "light"] as const}
              labels={{ system: "System", dark: "Dark", light: "Light" }}
              icons={{ system: Monitor, dark: Moon, light: Sun }}
              value={data.theme}
              onChange={actions.onTheme}
            />,
          ),
          row(
            "Interface size",
            "Scales text and controls across the app.",
            <SegmentedControl
              options={["compact", "default", "large"] as const}
              labels={{ compact: "Compact", default: "Default", large: "Large" }}
              value={values.interfaceSize}
              onChange={set("interfaceSize")}
            />,
          ),
          row(
            "Home background",
            "Follows the time of day, or stays on one.",
            select("homeScene", OPTIONS.HOME_SCENES),
          ),
          switchRow(
            "Reduce transparency",
            "Makes the floating chrome solid instead of frosted.",
            values.reduceTransparency,
            set("reduceTransparency"),
          ),
          row(
            "Reduce motion",
            "Turns off slides, shimmers and the effort fill.",
            select("motion", OPTIONS.MOTION),
          ),
          switchRow(
            "Show sidebar",
            "Workspaces, projects and active tasks.",
            data.showSidebar,
            actions.onShowSidebar,
          ),
        ]),
      ],
    },
    {
      id: "notifications",
      title: "Notifications",
      description: "When Nex taps you on the shoulder.",
      part: "general",
      groups: [
        card(
          "notify",
          [
            switchRow(
              "An agent needs you",
              "A permission prompt or a question is waiting.",
              values.notifyNeedsYou,
              set("notifyNeedsYou"),
            ),
            switchRow(
              "An agent finished",
              "A turn ended, or it pushed or opened a pull request.",
              values.notifyFinished,
              set("notifyFinished"),
            ),
            switchRow(
              "Something went wrong",
              "An agent stopped with an error.",
              values.notifyErrors,
              set("notifyErrors"),
            ),
            switchRow(
              "Usage warnings",
              "Near an account limit or your daily spend alert.",
              values.notifyUsage,
              set("notifyUsage"),
            ),
          ],
          "Notify me when",
        ),
        card(
          "delivery",
          [
            row(
              "Sound",
              "Played with each notification.",
              <>
                {select("sound", OPTIONS.SOUNDS)}
                <IconButton
                  aria-label="Play sound"
                  size="sm"
                  disabled={values.sound === "None"}
                  onClick={() => actions.onPlaySound(values.sound)}
                  className="disabled:pointer-events-none disabled:opacity-40"
                >
                  <Play width={12} height={12} strokeWidth={2} />
                </IconButton>
              </>,
            ),
            switchRow(
              "Skip the task you are looking at",
              "Only notify about tasks you are not looking at.",
              values.onlyInBackground,
              set("onlyInBackground"),
            ),
            switchRow(
              "Badge on the Dock icon",
              "Count of agents waiting on you.",
              values.dockBadge,
              set("dockBadge"),
            ),
          ],
          "Delivery",
        ),
      ],
    },
    {
      id: "shortcuts",
      title: "Shortcuts",
      description: "Click a shortcut to record a new one.",
      part: "general",
      groups: [
        {
          key: "shortcuts",
          card: true,
          blocks: [
            custom(
              "shortcuts",
              shortcuts.flatMap((shortcut) => [shortcut.label, ...hotkeyCaps(shortcut.hotkey)]),
              <GlideMenu
                className="flex flex-col [&>button+button]:border-t [&>button+button]:border-line"
                highlightClassName="inset-x-0 bg-hover"
              >
                {shortcuts.map((shortcut) => (
                  <ShortcutRow
                    key={shortcut.id}
                    shortcut={shortcut}
                    conflict={(hotkey) => shortcutConflict(shortcut.id, hotkey, shortcuts)}
                    onChange={(hotkey) =>
                      actions.onPreference("shortcuts", {
                        ...values.shortcuts,
                        [shortcut.id]: hotkey,
                      })
                    }
                  />
                ))}
              </GlideMenu>,
            ),
          ],
        },
        {
          key: "shortcuts-reset",
          card: false,
          blocks: [
            custom(
              "reset",
              ["Reset to defaults"],
              <div className="-mt-2 flex justify-end">
                <Button
                  variant="quiet"
                  size="sm"
                  disabled={Object.keys(values.shortcuts).length === 0}
                  onClick={() => actions.onPreference("shortcuts", {})}
                >
                  Reset to defaults
                </Button>
              </div>,
            ),
          ],
        },
      ],
    },
    {
      id: "agents",
      title: "Agents",
      description: "Your Claude accounts, the defaults for new tasks and how Nex runs Claude Code.",
      part: "work",
      groups: [
        {
          key: "accounts",
          card: true,
          label: (
            <span className="flex items-center gap-2">
              <ClaudeTile size={16} />
              Claude accounts
            </span>
          ),
          trailing: (
            <Button variant="quiet" size="sm" onClick={actions.onAddAccount}>
              <Plus width={12} height={12} strokeWidth={2.25} />
              Add account
            </Button>
          ),
          blocks: [
            custom(
              "accounts",
              data.accounts.flatMap((account) => [account.name, account.email, "accounts"]),
              <AccountList
                accounts={data.accounts}
                onMakeDefault={actions.onMakeDefault}
                onShowProfile={actions.onShowProfile}
                onRename={actions.onRenameAccount}
                onSignIn={actions.onSignInAgain}
                onRemove={(id) =>
                  setRemoving(data.accounts.find((account) => account.id === id) ?? null)
                }
              />,
            ),
          ],
        },
        card(
          "defaults",
          [
            row(
              "Model",
              "The model a new task starts with.",
              <SelectMenu value={data.model} options={data.models} onChange={set("model")} />,
            ),
            row(
              "Effort",
              "How long Claude thinks before it acts.",
              select("effort", OPTIONS.EFFORT_OPTIONS),
            ),
            row(
              "Permissions",
              "What Claude may do without asking.",
              select("permissions", OPTIONS.PERMISSION_OPTIONS),
            ),
          ],
          "Defaults for new tasks",
        ),
        card(
          "claude-code",
          [
            row(
              "Claude Code",
              data.claudeCode
                ? `v${data.claudeCode.version}${COMPAT_NOTE[data.claudeCode.compat]}`
                : "Not found on this Mac",
              (data.claudeCode || data.claudePathChangeable) && (
                <>
                  {data.claudeCode && (
                    <Field label="Claude Code path" value={data.claudeCode.path} readOnly />
                  )}
                  {data.claudePathChangeable && (
                    <Button size="sm" onClick={actions.onChangeClaudePath}>
                      Change
                    </Button>
                  )}
                  {data.claudeCode && (
                    <Button
                      size="sm"
                      disabled={data.claudeCode.upgrading}
                      onClick={actions.onUpgradeClaude}
                    >
                      {data.claudeCode.upgrading ? "Updating…" : "Update"}
                    </Button>
                  )}
                </>
              ),
            ),
            row(
              "Extra arguments",
              "Appended to every claude command Nex runs. Applies when an agent starts.",
              <Field
                label="Extra arguments"
                value={values.extraArgs}
                placeholder="--verbose"
                mono
                onCommit={set("extraArgs")}
              />,
            ),
          ],
          "Claude Code",
        ),
      ],
    },
    {
      id: "workspaces",
      title: "Workspaces & projects",
      description: "Each project keeps its own base branch, setup and quick commands.",
      part: "work",
      groups: [
        {
          key: "workspaces",
          card: false,
          label: "Workspaces",
          trailing: (
            <>
              <ImportRepoButton
                workspaces={data.workspaces}
                onImport={actions.onImportFromGitHub}
              />
              <Button variant="quiet" size="sm" onClick={actions.onAddWorkspace}>
                <Plus width={12} height={12} strokeWidth={2.25} />
                Add workspace
              </Button>
            </>
          ),
          blocks: data.workspaces.map((workspace) =>
            custom(
              workspace.id,
              [
                workspace.name,
                ...workspace.projects.flatMap((project) => [project.name, project.path]),
              ],
              <WorkspaceCard
                workspace={workspace}
                onOpenProject={actions.onOpenProject}
                onAddProject={() => actions.onAddProject(workspace.id)}
                onImport={() => actions.onImportFromGitHub(workspace.id)}
                onRename={(name) => actions.onRenameWorkspace(workspace.id, name)}
                onLookChange={(look) => actions.onWorkspaceLookChange(workspace.id, look)}
                onHiddenChange={(hidden) => actions.onWorkspaceHiddenChange(workspace.id, hidden)}
                onRemove={() => actions.onRemoveWorkspace(workspace.id)}
              />,
            ),
          ),
        },
      ],
    },
    ...(data.environments
      ? [
          {
            id: "environments",
            title: "Environments",
            description: "Each task can run its own services and data.",
            part: "work" as const,
            groups: environmentGroups(data.environments, values, actions, select, () =>
              setUninstalling(true),
            ),
          },
        ]
      : []),
    {
      id: "terminal",
      title: "Terminal",
      description: "The Shell tab and the processes quick commands start.",
      part: "work",
      groups: [
        card("terminal", [
          row(
            "Shell",
            "For new terminals. Login shell uses your account’s default.",
            select("shell", shellOptions, { width: "w-[160px]" }),
          ),
          row(
            "Font size",
            undefined,
            select("codeFontSize", OPTIONS.FONT_SIZES, { width: "w-16" }),
          ),
          row(
            "Cursor",
            undefined,
            <SegmentedControl
              options={["block", "bar", "underline"] as const}
              labels={{ block: "Block", bar: "Bar", underline: "Underline" }}
              value={values.cursor}
              onChange={set("cursor")}
            />,
          ),
          row(
            "Scrollback",
            "Lines kept per terminal.",
            select("scrollback", OPTIONS.SCROLLBACK, { width: "w-[120px]" }),
          ),
          switchRow(
            "Copy on select",
            "Selected text goes straight to the clipboard.",
            values.copyOnSelect,
            set("copyOnSelect"),
          ),
          switchRow(
            "Option as Meta",
            "For readline and Emacs shortcuts.",
            values.optionAsMeta,
            set("optionAsMeta"),
          ),
        ]),
      ],
    },
    {
      id: "diff",
      title: "Diff viewer",
      description: "How the Changes tab shows what a task did.",
      part: "work",
      groups: [
        card("diff", [
          row(
            "Default view",
            "Side by side, or a single column with the changes inline.",
            <SegmentedControl
              options={["unified", "split"] as const}
              labels={{ unified: "Unified", split: "Split" }}
              value={values.diffView}
              onChange={set("diffView")}
            />,
          ),
        ]),
      ],
    },
    {
      id: "notes",
      title: "Notes",
      description: "The Notes tab of every task.",
      part: "work",
      groups: [
        card("notes", [switchRow("Spellcheck", undefined, values.spellcheck, set("spellcheck"))]),
      ],
    },
    {
      id: "dictation",
      title: "Dictation",
      description: "Talk to Claude from the composer.",
      part: "work",
      groups: [
        card("dictation", [
          row(
            "Microphone",
            undefined,
            <SelectMenu
              value={data.microphone}
              options={data.microphones}
              onChange={actions.onMicrophone}
            />,
          ),
          row(
            "Language",
            "What you speak. Change it per message from the mic menu.",
            <SelectMenu
              value={data.language}
              options={data.languages}
              onChange={actions.onLanguage}
            />,
          ),
          row(
            "Shortcut",
            "Starts and stops dictation. Change it in Shortcuts.",
            <KeyCaps keys={[dictateKeys.join("")]} />,
          ),
        ]),
      ],
    },
    {
      id: "usage",
      title: "Usage",
      description: "Limits and spend across your Claude accounts.",
      part: "nex",
      groups: [
        card("usage", [
          switchRow(
            "Show usage in the titlebar",
            "Session limit and today’s spend.",
            values.showUsage,
            set("showUsage"),
          ),
          row(
            "Warn me at",
            "Of an account’s session or weekly limit.",
            select("warnAt", OPTIONS.WARN_AT, { width: "w-[100px]" }),
          ),
          row(
            "Daily spend alert",
            "Notifies you once a day when crossed. Empty turns it off.",
            <Field
              label="Daily spend alert"
              value={values.dailyAlert}
              placeholder="$20.00"
              width={100}
              onCommit={set("dailyAlert")}
            />,
          ),
          row(
            "Usage data",
            `Read from Claude Code logs · last scan ${data.lastScan}`,
            <Button size="sm" onClick={actions.onRescan}>
              Rescan usage
            </Button>,
          ),
        ]),
      ],
    },
    {
      id: "about",
      title: "About",
      description: "Version and your data.",
      part: "nex",
      groups: [
        card("about", [
          custom(
            "version",
            ["Nex", data.version],
            <div className="relative">
              <DitherStars />
              <div className="relative">
                <SettingRow
                  label={`Nex ${data.version}`}
                  leading={<NexLogo height={20} />}
                  control={null}
                />
              </div>
            </div>,
          ),
          row(
            "Open source licenses",
            undefined,
            <Button variant="quiet" size="sm" onClick={showLicenses}>
              View
            </Button>,
          ),
          row(
            "Data folder",
            "Tasks, notes and settings live here.",
            <>
              <Field label="Data folder" value={data.dataDir} width={250} readOnly />
              <Button size="sm" onClick={actions.onShowDataFolder}>
                Show
              </Button>
            </>,
          ),
        ]),
      ],
    },
  ];

  const visible = filterSections(sections, query);
  const indexGroups: SettingsIndexGroup[] = PARTS.map((part) => ({
    label: part.label,
    items: visible
      .filter((section) => section.part === part.id)
      .map((section) => ({ id: section.id, title: section.title })),
  })).filter((group) => group.items.length > 0);
  const visibleIds = visible.map((section) => section.id).join(",");

  useEffect(() => {
    const root = scrollRef.current;
    if (!root || view !== "settings") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive((top.target as HTMLElement).dataset.settingsSection ?? "general");
      },
      { root, rootMargin: "0px 0px -75% 0px" },
    );
    root
      .querySelectorAll("[data-settings-section]")
      .forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [view, visibleIds]);

  useHotkey("Mod+F", () => searchRef.current?.querySelector("input")?.focus(), {
    enabled: view === "settings",
  });

  const jumpTo = (id: string) => {
    if (scrollToSection(scrollRef.current, id, "smooth")) setActive(id);
  };
  const sectionId = initialSection?.id;
  const sectionRequest = initialSection?.request;
  const [settling, setSettling] = useState(Boolean(sectionId));
  useEffect(() => {
    const root = scrollRef.current;
    const content = root?.firstElementChild;
    if (!root || !content || !sectionId) return;
    setSettling(true);
    let settled: ReturnType<typeof setTimeout> | undefined;
    const reveal = () => setSettling(false);
    const cap = setTimeout(reveal, SETTLE_MAX_MS);
    const jump = () => {
      if (!scrollToSection(root, sectionId, "instant")) return;
      setActive(sectionId);
      clearTimeout(settled);
      settled = setTimeout(reveal, SETTLE_QUIET_MS);
    };
    jump();
    // Accounts, usage and workspaces load after the jump and push the section down, so follow it
    // until the person scrolls or clicks.
    const follow = new ResizeObserver(jump);
    follow.observe(content);
    const stop = () => follow.disconnect();
    const timer = setTimeout(stop, FOLLOW_SECTION_MS);
    for (const event of STOP_FOLLOWING) root.addEventListener(event, stop, { once: true });
    return () => {
      clearTimeout(timer);
      clearTimeout(cap);
      clearTimeout(settled);
      stop();
      for (const event of STOP_FOLLOWING) root.removeEventListener(event, stop);
    };
  }, [sectionId, sectionRequest]);

  return (
    <div className={cn("relative h-full", className)}>
      <div
        ref={scrollRef}
        className={cn(
          "relative h-full overflow-y-auto transition-opacity duration-150 ease-out [scrollbar-gutter:stable]",
          settling && "opacity-0",
        )}
      >
        {view === "licenses" ? (
          <div className="flex justify-center px-[60px] py-14">
            <LicensesView
              packages={data.licenses}
              onBack={() => setView("settings")}
              onOpen={setLicense}
            />
          </div>
        ) : (
          <div className="mx-auto flex w-fit gap-12 px-[60px] py-14">
            <div className="flex w-[664px] flex-col">
              <h1 className="m-0 text-3xl font-semibold tracking-[-0.03em] text-ink">Settings</h1>
              <div ref={searchRef} className="mt-4">
                <SearchField
                  value={query}
                  onChange={setQuery}
                  placeholder="Search settings"
                  shortcut={["⌘", "F"]}
                />
              </div>
              <div className="mt-11 flex flex-col gap-14">
                {visible.length === 0 && (
                  <p className="m-0 py-10 text-center text-sm text-ink-4">
                    No settings match “{query.trim()}”
                  </p>
                )}
                {visible.map((section) => (
                  <SettingsSection
                    key={section.id}
                    id={section.id}
                    title={section.title}
                    description={section.description}
                  >
                    {section.groups.map((group) =>
                      group.card ? (
                        <SettingsCard key={group.key} label={group.label} trailing={group.trailing}>
                          {group.blocks.map((block) => (
                            <div key={block.key}>{block.node}</div>
                          ))}
                        </SettingsCard>
                      ) : (
                        <div key={group.key} className="flex flex-col gap-2">
                          {(group.label || group.trailing) && (
                            <SettingsGroupHeader label={group.label} trailing={group.trailing} />
                          )}
                          {group.blocks.map((block) => (
                            <div key={block.key}>{block.node}</div>
                          ))}
                        </div>
                      ),
                    )}
                  </SettingsSection>
                ))}
              </div>
            </div>
            <aside className="sticky top-14 h-fit pt-1">
              <SettingsIndex groups={indexGroups} active={active} onSelect={jumpTo} />
            </aside>
          </div>
        )}
      </div>
      {license && (
        <Overlay fullWindow onClose={() => setLicense(null)}>
          <LicenseSheet item={license} onClose={() => setLicense(null)} />
        </Overlay>
      )}
      {uninstalling && data.environments && (
        <Overlay fullWindow onClose={() => setUninstalling(false)}>
          <RemoveEnvironmentsDialog
            containers={data.environments.containers}
            removesRuntime={data.environments.removesRuntime}
            removing={data.environments.removing}
            onCancel={() => setUninstalling(false)}
            onRemove={() =>
              void actions.onRemoveEnvironments().finally(() => setUninstalling(false))
            }
          />
        </Overlay>
      )}
      {removing && (
        <Overlay fullWindow onClose={() => setRemoving(null)}>
          <RemoveAccountDialog
            account={removing}
            fallback={fallback?.name}
            onCancel={() => setRemoving(null)}
            onConfirm={() => {
              actions.onRemoveAccount(removing.id);
              setRemoving(null);
            }}
          />
        </Overlay>
      )}
    </div>
  );
}
