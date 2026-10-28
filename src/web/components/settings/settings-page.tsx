import { useEffect, useRef, useState, type ReactNode } from "react";
import { Computer, HalfMoon, Play, Plus, SunLight } from "iconoir-react";
import { ClaudeTile } from "@/components/atoms/agent-tile";
import { Button } from "@/components/atoms/button";
import { IconButton } from "@/components/atoms/icon-button";
import { KeyCaps } from "@/components/atoms/kbd";
import { SearchField } from "@/components/atoms/search-field";
import { SegmentedControl } from "@/components/atoms/segmented-control";
import { Switch } from "@/components/atoms/switch";
import { TextField } from "@/components/atoms/text-field";
import { ValuePill } from "@/components/atoms/value-pill";
import GlideMenu from "@/components/primitives/glide-menu";
import { Overlay } from "@/components/primitives/overlay";
import { SelectMenu, type SelectOption } from "@/components/primitives/select-menu";
import { SettingRow, SettingsCard, SettingsGroupHeader } from "@/components/primitives/setting-row";
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
import { MachineCard, type MachineStatus } from "@/components/settings/machine-card";
import { SettingsIndex, type SettingsIndexGroup } from "@/components/settings/settings-index";
import { SettingsSection } from "@/components/settings/settings-section";
import * as OPTIONS from "@/components/settings/settings-values";
import type { SettingsValues } from "@/components/settings/settings-values";
import { ShortcutRow } from "@/components/settings/shortcut-row";
import { WorkspaceCard, type SettingsWorkspace } from "@/components/settings/workspace-card";
import { filterSections } from "@/lib/settings-search";
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

export interface ClaudeCodeInstall {
  version: string;
  path: string;
  upToDate: boolean;
  liveTranscripts: number;
}

type SwitchKey = {
  [K in keyof SettingsValues]: SettingsValues[K] extends boolean ? K : never;
}[keyof SettingsValues];

const PARTS: { id: Section["part"]; label: string }[] = [
  { id: "general", label: "General" },
  { id: "work", label: "Work" },
  { id: "nex", label: "Nex" },
];

const row = (label: string, description: string | undefined, control: ReactNode): Block => ({
  key: label,
  keywords: description ? [label, description] : [label],
  node: <SettingRow label={label} description={description} control={control} />,
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

function Field({
  label,
  value,
  placeholder,
  width = 200,
}: {
  label: string;
  value?: string;
  placeholder?: string;
  width?: number;
}) {
  return (
    <span style={{ width }}>
      <TextField
        defaultValue={value}
        placeholder={placeholder}
        aria-label={label}
        mono
        size="md"
        className="h-[30px] rounded-control text-xs"
      />
    </span>
  );
}

export function SettingsPage({
  accounts: initialAccounts,
  workspaces,
  machine,
  claudeCode,
  licenses,
  version,
  className,
}: {
  accounts: readonly ClaudeAccount[];
  workspaces: readonly SettingsWorkspace[];
  machine: MachineStatus;
  claudeCode: ClaudeCodeInstall;
  licenses: readonly PackageLicense[];
  version: string;
  className?: string;
}) {
  const [values, setValues] = useState<SettingsValues>(OPTIONS.DEFAULT_SETTINGS);
  const [accounts, setAccounts] = useState(initialAccounts);
  const [removing, setRemoving] = useState<ClaudeAccount | null>(null);
  const [view, setView] = useState<"settings" | "licenses">("settings");
  const [license, setLicense] = useState<PackageLicense | null>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("general");
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const set =
    <K extends keyof SettingsValues>(key: K) =>
    (value: SettingsValues[K]) =>
      setValues((current) => ({ ...current, [key]: value }));

  const toggle = (key: SwitchKey) => <Switch checked={values[key]} onChange={set(key)} />;

  const select = <K extends keyof SettingsValues>(
    key: K,
    options: readonly SelectOption<string>[],
    { width, mono = false }: { width?: string; mono?: boolean } = {},
  ) => (
    <SelectMenu
      value={values[key] as string}
      options={options}
      mono={mono}
      onChange={(value) => set(key)(value as SettingsValues[K])}
      className={width && cn("min-w-0", width)}
    />
  );

  const fallback = accounts.find((account) => account.isDefault && account.id !== removing?.id);

  const sections: Section[] = [
    {
      id: "general",
      title: "General",
      description: "How Nex starts, quits and hands off to your other apps.",
      part: "general",
      groups: [
        card("general", [
          row("Open at login", "Start Nex when you sign in to your Mac.", toggle("openAtLogin")),
          row(
            "Open in IDE",
            "The editor “Open in IDE” launches for a task.",
            select("ide", OPTIONS.IDES),
          ),
          row(
            "Open in terminal",
            "Used by “Open in terminal” on a task or worktree.",
            select("terminal", OPTIONS.TERMINALS),
          ),
          row(
            "When you quit with agents working",
            "Quitting stops every Claude Code session Nex started.",
            <SegmentedControl
              options={["ask", "quit"] as const}
              labels={{ ask: "Ask first", quit: "Quit anyway" }}
              value={values.quitWithAgents}
              onChange={set("quitWithAgents")}
            />,
          ),
          row(
            "Confirm before closing a task",
            "Closing removes its worktree unless you keep it.",
            toggle("confirmClose"),
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
              icons={{ system: Computer, dark: HalfMoon, light: SunLight }}
              value={values.theme}
              onChange={set("theme")}
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
            "Code font",
            "Diffs, terminals and inline code.",
            <>
              {select("codeFont", OPTIONS.CODE_FONTS)}
              {select("codeFontSize", OPTIONS.FONT_SIZES, { width: "w-16" })}
            </>,
          ),
          row(
            "Reduce transparency",
            "Makes the floating chrome solid instead of frosted.",
            toggle("reduceTransparency"),
          ),
          row(
            "Reduce motion",
            "Turns off slides, shimmers and the effort fill.",
            select("motion", OPTIONS.MOTION),
          ),
          row("Show sidebar", "Workspaces, projects and active tasks.", toggle("showSidebar")),
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
            row(
              "An agent needs you",
              "A permission prompt or a question is waiting.",
              toggle("notifyNeedsYou"),
            ),
            row(
              "An agent finished",
              "The task stopped and is ready for review.",
              toggle("notifyFinished"),
            ),
            row(
              "Something went wrong",
              "A session crashed, lost connection or hit a limit.",
              toggle("notifyErrors"),
            ),
            row(
              "Usage warnings",
              "Near the session limit or your daily spend alert.",
              toggle("notifyUsage"),
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
                <IconButton aria-label="Play sound" size="sm">
                  <Play width={12} height={12} strokeWidth={2} />
                </IconButton>
              </>,
            ),
            row(
              "Only when Nex is in the background",
              "No banners for the task you are looking at.",
              toggle("onlyInBackground"),
            ),
            row("Badge on the Dock icon", "Count of agents waiting on you.", toggle("dockBadge")),
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
              values.shortcuts.flatMap((shortcut) => [shortcut.label, ...shortcut.keys]),
              <GlideMenu
                className="flex flex-col [&>button+button]:border-t [&>button+button]:border-line"
                highlightClassName="inset-x-0 bg-hover"
              >
                {values.shortcuts.map((shortcut) => (
                  <ShortcutRow
                    key={shortcut.id}
                    shortcut={shortcut}
                    onChange={(keys) =>
                      set("shortcuts")(
                        values.shortcuts.map((item) =>
                          item.id === shortcut.id ? { ...item, keys, through: undefined } : item,
                        ),
                      )
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
                  onClick={() => set("shortcuts")(OPTIONS.DEFAULT_SHORTCUTS)}
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
            <Button variant="quiet" size="sm">
              <Plus width={12} height={12} strokeWidth={2.25} />
              Add account
            </Button>
          ),
          blocks: [
            custom(
              "accounts",
              accounts.flatMap((account) => [account.name, account.email, "accounts"]),
              <AccountList
                accounts={accounts}
                onMakeDefault={(id) =>
                  setAccounts((list) =>
                    list.map((account) => ({ ...account, isDefault: account.id === id })),
                  )
                }
                onRemove={(id) =>
                  setRemoving(accounts.find((account) => account.id === id) ?? null)
                }
              />,
            ),
          ],
        },
        card(
          "defaults",
          [
            row(
              "Account",
              "Used when a task does not pick one.",
              <SelectMenu
                value={values.defaultAccount}
                options={accounts.map((account) => ({ value: account.id, label: account.name }))}
                onChange={set("defaultAccount")}
              />,
            ),
            row(
              "Model",
              "Passed to Claude Code as --model.",
              select("model", OPTIONS.MODEL_OPTIONS),
            ),
            row(
              "Effort",
              "How long Claude thinks before it acts.",
              select("effort", OPTIONS.EFFORTS),
            ),
            row(
              "Permissions",
              "What Claude may do without asking.",
              select("permissions", OPTIONS.PERMISSIONS),
            ),
            row(
              "Resume last session",
              "Reopening a task continues its conversation.",
              toggle("resumeSession"),
            ),
          ],
          "Defaults for new tasks",
        ),
        card(
          "claude-code",
          [
            row(
              "Claude Code",
              `v${claudeCode.version} · ${claudeCode.upToDate ? "up to date" : "update available"}`,
              <>
                <Field label="Claude Code path" value={claudeCode.path} />
                <Button size="sm">Change</Button>
              </>,
            ),
            row(
              "Extra arguments",
              "Appended to every claude command Nex runs.",
              <Field label="Extra arguments" placeholder="--verbose" />,
            ),
            row(
              "Live agent view",
              `Hooks in ~/.claude/settings.json · ${claudeCode.liveTranscripts} live transcripts`,
              <>
                <ValuePill tone="green">Connected</ValuePill>
                <Button size="sm">Reinstall hooks</Button>
              </>,
            ),
          ],
          "Claude Code",
        ),
      ],
    },
    {
      id: "workspaces",
      title: "Workspaces & projects",
      description: "Each project keeps its own base branch, setup script and quick commands.",
      part: "work",
      groups: [
        {
          key: "workspaces",
          card: false,
          label: "Workspaces",
          trailing: (
            <>
              <Button variant="quiet" size="sm">
                Import from GitHub
              </Button>
              <Button variant="quiet" size="sm">
                <Plus width={12} height={12} strokeWidth={2.25} />
                Add workspace
              </Button>
            </>
          ),
          blocks: workspaces.map((workspace) =>
            custom(
              workspace.id,
              [
                workspace.name,
                ...workspace.projects.flatMap((project) => [project.name, project.path]),
              ],
              <WorkspaceCard workspace={workspace} />,
            ),
          ),
        },
        card(
          "history",
          [
            row(
              "Keep closed tasks",
              "Their conversation and notes stay searchable.",
              select("history", OPTIONS.HISTORY, { width: "w-[120px]" }),
            ),
          ],
          "History",
        ),
      ],
    },
    {
      id: "worktrees",
      title: "Worktrees",
      description: "Every task gets its own git worktree and branch.",
      part: "work",
      groups: [
        card("worktrees", [
          row(
            "Worktrees folder",
            "Where Nex creates a worktree for each task.",
            <>
              <Field label="Worktrees folder" value="~/.nex/worktrees" />
              <Button size="sm">Change</Button>
            </>,
          ),
          row(
            "Branch prefix",
            "Prepended to every new task branch.",
            <Field label="Branch prefix" value={values.branchPrefix} width={120} />,
          ),
          row(
            "Copy into new worktrees",
            "Untracked files a worktree needs to run.",
            <Field label="Copy into new worktrees" value={values.copyIntoWorktrees} />,
          ),
          row(
            "Run the project setup script",
            "Installs dependencies right after the worktree is created.",
            toggle("runSetup"),
          ),
          row(
            "When a task is closed",
            "What happens to its worktree folder.",
            <SegmentedControl
              options={["ask", "keep", "remove"] as const}
              labels={{ ask: "Ask", keep: "Keep", remove: "Remove" }}
              value={values.onClose}
              onChange={set("onClose")}
            />,
          ),
          row(
            "Delete the branch too",
            "Only when the worktree is removed and the branch is merged.",
            toggle("deleteBranch"),
          ),
        ]),
      ],
    },
    {
      id: "environments",
      title: "Environments",
      description: "Each task can run its own services and data.",
      part: "work",
      groups: [
        {
          key: "machine",
          card: false,
          blocks: [
            custom(
              "machine",
              ["Linux machine", "Restart machine", machine.runtime],
              <MachineCard machine={machine} />,
            ),
          ],
        },
        card(
          "behaviour",
          [
            row(
              "Memory for the machine",
              "Shared by every environment. Changing it restarts the machine.",
              select("memory", OPTIONS.MEMORY, { width: "w-[100px]" }),
            ),
            row(
              "Run at most",
              "New tasks wait for room once this many are running.",
              select("runAtMost", OPTIONS.RUN_AT_MOST),
            ),
            row(
              "Pause idle environments after",
              "Frees memory. They resume when you open the task.",
              select("pauseAfter", OPTIONS.PAUSE_AFTER, { width: "w-[110px]" }),
            ),
            row(
              "Start when a task is created",
              "Otherwise it starts the first time you open the task.",
              toggle("startOnCreate"),
            ),
          ],
          "Behaviour",
        ),
        card(
          "browser",
          [
            row(
              "Address",
              "Every task opens at workspace-task.nex in any browser.",
              <>
                <Field label="Address" value=".nex" width={80} />
                <Button variant="quiet" size="sm">
                  Test
                </Button>
              </>,
            ),
            row(
              "HTTPS certificate",
              "Trusted only on this Mac. Needed for cookies and service workers.",
              <>
                <ValuePill tone="green">Trusted</ValuePill>
                <Button size="sm">Reinstall</Button>
              </>,
            ),
          ],
          "Browser",
        ),
        card("remove-environments", [
          row(
            "Remove environments",
            "Deletes the machine, clean bases and the .nex setup. Projects are not touched.",
            <Button variant="destructive" size="sm">
              Uninstall…
            </Button>,
          ),
        ]),
      ],
    },
    {
      id: "terminal",
      title: "Terminal",
      description: "The Shell tab and the processes quick commands start.",
      part: "work",
      groups: [
        card("terminal", [
          row(
            "Shell",
            "Login shell for new terminals.",
            select("shell", OPTIONS.SHELLS, { width: "w-[140px]", mono: true }),
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
          row(
            "Copy on select",
            "Selected text goes straight to the clipboard.",
            toggle("copyOnSelect"),
          ),
          row("Option as Meta", "For readline and Emacs shortcuts.", toggle("optionAsMeta")),
          row(
            "Stop quick commands when a task closes",
            "Dev servers and watchers started from the task bar.",
            toggle("stopCommands"),
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
          row(
            "Compare against",
            "Everything since the task branched, or only uncommitted work.",
            select("compare", OPTIONS.COMPARE),
          ),
          row(
            "Highlight word changes",
            "Tint the changed tokens inside a modified line.",
            toggle("wordDiff"),
          ),
          row(
            "Ignore whitespace",
            "Hide lines that only differ in indentation or spacing.",
            toggle("ignoreWhitespace"),
          ),
          row("Show file tree", "Keep the changed-files panel open.", toggle("fileTree")),
          row(
            "Collapse large files",
            "Files with more changed lines start folded.",
            select("collapse", OPTIONS.COLLAPSE),
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
        card("notes", [
          row(
            "Start new notes from",
            "Prefill each task’s notes.",
            select("noteTemplate", OPTIONS.NOTE_TEMPLATES),
          ),
          row(
            "Markdown shortcuts",
            "Type #, -, [] or ``` to format as you write.",
            toggle("markdownShortcuts"),
          ),
          row("Spellcheck", undefined, toggle("spellcheck")),
        ]),
      ],
    },
    {
      id: "dictation",
      title: "Dictation",
      description: "Talk to Claude from the composer.",
      part: "work",
      groups: [
        card("dictation", [
          row("Microphone", undefined, select("microphone", OPTIONS.MICROPHONES)),
          row(
            "Language",
            "What you speak. Change it per message from the mic menu.",
            select("language", OPTIONS.LANGUAGES),
          ),
          row(
            "Shortcut",
            "Hold to talk, release to stop.",
            <>
              <KeyCaps keys={["⌥", "Space"]} />
              <Button variant="quiet" size="sm">
                Change
              </Button>
            </>,
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
          row(
            "Show usage in the titlebar",
            "Session limit and today’s spend.",
            toggle("showUsage"),
          ),
          row(
            "Warn me at",
            "Of the 5-hour session limit.",
            select("warnAt", OPTIONS.WARN_AT, { width: "w-[100px]" }),
          ),
          row(
            "Daily spend alert",
            "Notifies you once a day when crossed.",
            <Field label="Daily spend alert" value={values.dailyAlert} width={100} />,
          ),
          row(
            "Usage data",
            "Read from Claude Code logs · last scan 2 min ago",
            <Button size="sm">Rescan usage</Button>,
          ),
        ]),
      ],
    },
    {
      id: "about",
      title: "Updates & about",
      description: "Version, updates and your data.",
      part: "nex",
      groups: [
        card("updates", [
          row(
            `Nex ${version}`,
            "Up to date · checked today at 9:41",
            <Button size="sm">Check for updates</Button>,
          ),
          row(
            "Update channel",
            undefined,
            <SegmentedControl
              options={["stable", "beta"] as const}
              labels={{ stable: "Stable", beta: "Beta" }}
              value={values.channel}
              onChange={set("channel")}
            />,
          ),
          row(
            "Install updates automatically",
            "Restarts only when no agent is working.",
            toggle("autoUpdate"),
          ),
          row(
            "Open source licenses",
            undefined,
            <Button variant="quiet" size="sm" onClick={() => setView("licenses")}>
              View
            </Button>,
          ),
        ]),
        card(
          "data",
          [
            row(
              "Data folder",
              "Tasks, notes and settings live here.",
              <>
                <Field label="Data folder" value="~/Library/Application Support/Nex" width={250} />
                <Button size="sm">Show</Button>
              </>,
            ),
            row(
              "Reset Nex",
              "Clears settings and history. Worktrees and accounts stay.",
              <Button variant="destructive" size="sm">
                Reset…
              </Button>,
            ),
          ],
          "Data",
        ),
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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey && event.key === "f" && view === "settings") {
        event.preventDefault();
        searchRef.current?.querySelector("input")?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [view]);

  const jumpTo = (id: string) => {
    const root = scrollRef.current;
    const section = root?.querySelector<HTMLElement>(`[data-settings-section="${id}"]`);
    if (!root || !section) return;
    setActive(id);
    root.scrollTo({ top: section.offsetTop - 24, behavior: "smooth" });
  };

  return (
    <div className={cn("relative h-full", className)}>
      <div ref={scrollRef} className="relative h-full overflow-y-auto">
        {view === "licenses" ? (
          <div className="flex justify-center px-[60px] py-14">
            <LicensesView
              packages={licenses}
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
        <Overlay offset={120} onClose={() => setLicense(null)}>
          <LicenseSheet item={license} onClose={() => setLicense(null)} />
        </Overlay>
      )}
      {removing && (
        <Overlay offset={160} onClose={() => setRemoving(null)}>
          <RemoveAccountDialog
            account={removing}
            fallback={fallback?.name}
            onCancel={() => setRemoving(null)}
            onConfirm={() => {
              setAccounts((list) => list.filter((account) => account.id !== removing.id));
              setRemoving(null);
            }}
          />
        </Overlay>
      )}
    </div>
  );
}
