# Nex

macOS desktop app for running Claude Code on many git worktrees at once, with terminals, notes, a diff viewer and a built-in browser per task.

## Tech Stack

- **Runtime:** Electron 44, macOS only (the builder config has no Windows or Linux targets)
- **Frontend:** React 19 + TypeScript 6
- **Styling:** Tailwind CSS 4 (via `@tailwindcss/vite`)
- **Build:** electron-vite 6 + Vite 8 (the Vite+ core)
- **Toolchain:** Vite+ (`vp`, pinned through the pnpm catalog) — Vitest, Oxlint and Oxfmt behind one CLI, configured in `vite.config.ts`; electron-vite still builds main, preload and renderer from `electron.vite.config.ts`
- **Package:** electron-builder 26
- **Routing:** react-router 8 data router via `createMemoryRouter` (no real URLs in Electron)
- **State:** Zustand (hook-based stores in `web/stores/`)
- **Design system:** beautiful-ui, copied in full and being restyled to the wireframes · `class-variance-authority` + `clsx` + `tailwind-merge`
- **Icons:** lucide-react (the wireframes draw every icon with Lucide); brand marks Lucide lacks (GitHub, Apple) are in `atoms/brand-icons.tsx`
- **Toasts:** Sonner, rendering our own `Toast` / `CompactToast` cards
- **Shortcuts:** TanStack Hotkeys (`@tanstack/react-hotkeys`, `HotkeysProvider` in `App.tsx`)
- **Database:** better-sqlite3 (SQLite in main process)
- **Package Manager:** pnpm 10 (`vite` is aliased to `@voidzero-dev/vite-plus-core` through the `pnpm-workspace.yaml` catalog — never add `vite` directly)

## Project Structure

```
src/
├── native/                    # Electron / Node.js (main process)
│   ├── main/
│   │   ├── index.ts           # App lifecycle, menu, IPC, DB init
│   │   ├── app-window.ts      # Window creation and management
│   │   ├── fix-env.ts         # Restores the login shell PATH in packaged builds
│   │   └── menu.ts            # Native app menu
│   ├── preload/
│   │   ├── index.ts           # Context bridge (typed API surface)
│   │   └── index.d.ts         # Preload types (NexAPI interface)
│   ├── ipc/
│   │   ├── channels.ts        # IPC channel constants (typed)
│   │   └── handlers.ts        # IPC handlers (wired to repositories)
│   └── db/
│       ├── database.ts        # SQLite connection, init, close
│       ├── migrations.ts      # Schema versions (incremental migrations)
│       ├── types.ts           # Entity types (Workspace, Project, Worktree, Task, etc.)
│       └── repositories/
│           ├── workspace.repo.ts
│           ├── project.repo.ts
│           ├── worktree.repo.ts
│           ├── task.repo.ts
│           └── settings.repo.ts  # Key-value settings (window state, preferences)
│
├── web/                       # React / UI (renderer process)
│   ├── index.html             # Entry HTML (shell skeleton for instant load)
│   ├── main.tsx               # React entry (react-scan in dev)
│   ├── App.tsx                # Root component (ErrorBoundary + Titlebar + Router)
│   ├── routes/
│   │   ├── home.tsx           # Main view (empty — being rebuilt from the wireframes)
│   │   └── design-system.tsx  # Living style guide (dev only)
│   ├── components/
│   │   ├── layout/            # App structure (app-shell, titlebar)
│   │   ├── design-system/     # The gallery rendered by routes/design-system.tsx
│   │   ├── atoms/             # beautiful-ui building blocks
│   │   ├── primitives/        # beautiful-ui primitives
│   │   └── error-boundary.tsx # React error boundary
│   ├── hooks/
│   │   └── use-system-theme.ts
│   ├── stores/                # Zustand stores
│   │   └── settings.store.ts  # Theme preference
│   ├── lib/
│   │   ├── utils.ts           # `cn()` — clsx + tailwind-merge
│   │   └── theme.ts           # applyTheme / getTheme
│   ├── assets/                # Images, SVGs
│   │   └── brand/           # Nex logos: original SVGs and the nex-mark.webp the app renders
│   ├── styles/
│   │   └── globals.css        # Tailwind + theme variables + scrollbar styles
│   └── types/
│       └── env.d.ts           # Vite types
│
├── build/                     # Build & packaging config
│   ├── electron-builder.yml   # Electron builder config
│   ├── entitlements.mac.plist # macOS entitlements
│   └── icon.icns
│
├── scripts/
│   └── resign.js              # macOS ad-hoc re-signing (afterSign hook)
│
├── .changeset/                # Changesets config and the pending changesets (one Markdown file per change)
├── .github/workflows/         # checks.yml (every PR) and release.yml (push to main → checks → version PR / tag)
├── CHANGELOG.md               # Written by Changesets when a version is released; never edited by hand
│
└── .claude/skills/            # Agent skills (frontend-design, vercel patterns, etc.)
```

## Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Typecheck + build
pnpm build:mac        # Build + package for macOS (includes re-sign)
pnpm check            # vp check: Oxfmt + Oxlint
pnpm lint             # Oxlint
pnpm fmt              # Oxfmt
pnpm test             # Vitest (pure lib/ and store logic)
pnpm typecheck        # TypeScript check (node + web)
pnpm changeset        # add a changeset (Claude writes them by hand, see Releases)
```

## Architecture

### Native ↔ Web separation

- `src/native/` runs in Node.js (Electron main process). Has access to filesystem, git, pty, etc.
- `src/web/` runs in the renderer (browser). Pure React UI.
- Communication via a **typed preload API**. The renderer accesses `window.api.*` — never `ipcRenderer` directly.
- Preload exposes explicit functions only (e.g. `window.api.getWorkspaces()`). Never expose a generic `invoke` or raw `ipcRenderer` to the renderer.
- Types for the preload API live in `native/preload/index.d.ts` (`NexAPI` interface).

### Data layer

- **SQLite** via `better-sqlite3` runs in the main process. DB file at `~/Library/Application Support/Nex/nex.db`.
- **Repositories** in `native/db/repositories/` provide typed CRUD functions per entity.
- **Settings** use a key-value table (`settings.repo.ts`) for app preferences, window state, etc.
- **Migrations** are incremental in `native/db/migrations.ts` using `PRAGMA user_version`. Each entry in the `migrations` array is a new version. Never modify existing migrations — always append a new one.
- **Zustand stores** in `web/stores/` cache DB data in the renderer. Hydrated on app mount via `useAppData` hook.
- Data flow: `Component → window.api.* → IPC → Repository → SQLite → response → Zustand set()`

### Window

- Transparent window (`transparent: true`) to remove macOS native border
- `titleBarStyle: 'hiddenInset'` with custom `trafficLightPosition`
- Window state (position, size, maximized) persisted via `settings.repo.ts`
- Shell skeleton in `index.html` renders before React for instant visual load
- `user-select: none`, `cursor: default`, `-webkit-user-drag: none` on body for native feel

### Design system (beautiful-ui)

The components are a verbatim copy of [beautiful-ui](https://github.com/slev12397/beautiful-ui)
(MIT), taken so every one of them can then be restyled to match the wireframes (see Design
Reference). Only three things changed on the way in: file names are kebab-case, imports point at
our paths, and comments that broke the [Comments](#comments) rules were removed.

- `components/atoms/` — the shared building blocks: `button`, `chip`, `entity-chip`,
  `progress-ring`, `segmented-control`, `shimmer`, `status-pill`, `stream-text`, `switch`,
  `text-row`, `value-pill`.
- `components/primitives/` — one self-contained file per primitive: `agent-screen`,
  `approval-card`, `chat-composer`, `code-block`, `context-cards`, `diff-table`, `filter-table`,
  `fine-tune-card`, `flowchart`, `glide-menu`, `insight-cards`, `loading-state`, `prompt-bar`,
  `recommendation-card`, `records-table`, `search-list`, `selection-actions`, `sidebar-nav`,
  `streaming-text`, `task-rows`, `thinking-state`, `tool-chips`.
- `sidebar-nav` used a paid icon set (`@central-icons-react`); it now uses `lucide-react`.
- `styles/globals.css` is beautiful-ui's foundation (tokens, `@theme`, shadow-plugin, per-component
  CSS and keyframes) plus a short Nex block at the end for the fonts and the native-feel rules.

**Restyled to the wireframes so far** (these are the ones to use):

- atoms: `button` (primary green · secondary outline · inverse · danger · quiet · destructive;
  sizes 24/28/34/36, optional `kbd` hint), `icon-button`, `kbd` (`Kbd`, `KeyCaps`), `status-dot`,
  `status-pill`, `value-pill` (badges), `chip` (quick commands, `CountChip`), `tabs` (task views),
  `segmented-control` (text or icons), `switch`, `select-button`, `text-field`, `selection-mark`
  (clickable when it gets `onClick`), `option-card`,
  `agent-tile` (`ClaudeTile`), `agent-logo` (Claude or shell), `entity-chip` (`Monogram` workspace badge), `meter`, `orbit`,
  `shimmer`, `stream-text` (block caret), `spinner` (`Spinner`, `SpinnerArc` icon), `color-swatches`, `dither-progress`, `dither-field` (the effort slider's dot field), `dither-scene` (`DitherScene`: a dithered sea and sky at dawn, day, dusk or night — `scenePhase` from the hour — with drifting cumulus (clusters of puffs lit from above, clear of the sun or moon at the start), waves, the light's reflection, stars and meteors at night; opaque, drawn at half resolution with a 4×4 screen in three tones (`--scene-<phase>-0..2`), the only colored backdrop in the app, and `HomeHero` sits on it in the dark theme; `focusRef` centers the quiet area behind that element; the Home background preference (`homeScene`: time of day, a fixed phase or off) goes through `homeScenePhase`; math in `lib/dither-scene.ts`), `dither-stars` (a canvas starfield in the dither palette — three parallax layers drifting left, stars that twinkle, pulse or bob, sparkles and meteors; pauses off screen; math in `lib/dither.ts`), `slider` (`Slider`: a range input with a thin track and a round thumb), `checkbox` (square), `search-field` (search input with an optional key hint), `hover-swap` (`HoverSwap`: a row's detail cross-fades into its hover action), `expand` (`Expand`: a detail opens and closes by height and fade; its content mounts on first open), `side-scroll` (`SideScroll`: a row that scrolls sideways — wheel too — with a dark blurred fade on each edge that has more, centering the `data-scroll-focus` item when `focusKey` changes), `inline-code`, `service-chip` (`ServiceChip`: a status dot and a service name, pressed while its detail is open), `nex-logo` (`NexLogo`, the isotype on its own — never inside a tile — and `NexWordmark`), `logo-tile` (connector and MCP
  logos). `segmented-control` also has a `bar` variant (icon-only, full width) and `switch` /
  `selection-mark` take `size="sm"`.
- primitives: `menu` (`Menu`, `MenuItem`, `MenuLabel`, `MenuSeparator` over `GlideMenu`),
  `anchored-popover` (opens a menu above its trigger, closes on outside click or Esc),
  `modal-card` (`ModalCard`, `StatusIcon`), `overlay` (the scrim behind the new task dialog and ⌘K), `toast` (`Toast`: no icon — a status line with a flat dot or spinner, its word and the
  meta, then title, body, code, tips, progress or a countdown bar; one filled action at most; solid
  surface, close on hover; `CompactToast` is a dot and one line), `toaster` (Sonner's `Toaster`, mounted once in `app-shell.tsx`; toasts are fired with `notify` /
  `notifyCompact` from `lib/notify.tsx`, which render our cards through `toast.custom` and dismiss on
  any action; the stacked ghosts are styled in `globals.css`; `task/app-agent-toasts.tsx` fires needs you, done, stopped, pushed and pull request toasts for tasks you are not looking at, copy in `lib/agent-toasts.ts`; `hooks/use-limit-warnings.ts` warns at 80% and 95% of an account's limit, once per window), `setting-row`
  (`SettingsCard` with label and trailing actions, `SettingsGroupHeader`, `SettingRow`),
  `select-menu` (`SelectMenu`: a `SelectButton` that opens a checked `Menu`), `key-value-list`
  (`KeyValueList`: editable `NAME = value` rows, used for environment variables), `command-rows`
  (`CommandRows`: a target select and a command per row, used for prepare steps), `disclosure`
  (`Disclosure`: a chevron row with a label and a one-line summary that opens its content with `Expand`).
- app composites: `layout/` (`TitlebarView` with `SearchButton` and `UsagePill`, which opens the `usagePanel` slot), `sidebar/`
  (`Sidebar`, `SidebarRail`, `TaskRow`, `ProjectGroup`, `WorkspaceHeader`, `SidebarLink`,
  `NewWorkspaceRow` — the inline name field with its color and badge popover — and `AddProjectRow`; task rows show a starting orbit or a red globe, workspace badges are an initial, an icon (`lib/workspace-icons.ts`) or an image, picked with `WorkspaceBadgePicker`; `environments` is a footer slot, the workspace list scrolls, and hovering a workspace in the rail opens `WorkspacePeek`; `layout/sidebar-frame.tsx` animates the width, swaps rail and sidebar and toggles on ⌘S), `task/`
  (`TaskCard`, `TaskHeader`, `TaskTabBar`, `Conversation` blocks `UserBubble` · `AgentText` · `ToolRow`
  · `InlineDiff` · `ToolOutput` · `WorkingLine`, `PermissionCard`, `QuestionCard`, `EnvButton`, `TaskEmptyState`;
  `blocks` — every tool call is a `BlockRow` with an optional `BlockDetail` body (`DiffLines`,
  `OutputLines`, `FileList`, `GrepMatches`, `WebResults`, `ImagePreview`); `block-cards` (`TodoPlan`,
  `SubagentCard`, `ParallelAgents`, `PlanApproval`, `PullRequestCard`, `UsageLimitCard`,
  `TurnSummary`, `SystemDivider`, `SystemRow`); `agent-flow` (`ThinkingLine`, `ThoughtToggle`,
  `StreamingParagraph`, `QueuedMessage`, `ResponseActions`, `ContextMeter`); `markdown` (`Md*`,
  `CodeBlock`)),
  `composer/` (`Composer` holds its own menu state; `ComposerPill`, `ContextRing`, `PermissionChip` +
  `PermissionMenu`, `ModelChip` + `ModelMenu` with `EffortSlider` (X-high/Max dither green, Ultracode
  violet as the last step), `AddMenu` + `ConnectorsMenu` + `ConnectorAlert`, `DictateButton` +
  `DictationMenu` + `VoiceOrb` + `LevelMeter`; `RichEditor` is the tiptap input — `@` and `/` open
  `FilePicker` / `CommandPicker` and insert `FilePill` / `CommandPill`, a pasted or typed link becomes a
  `LinkPill` (read from the URL only, `lib/link-preview.ts`; the node lives in `link-pill-node.ts` and the
  new task `DetailsEditor` uses it too), 20+ pasted lines become a card, and
  images or files land in the `AttachmentTray` (`DropOverlay` while dragging)), `changes/`
  (`ChangesView` in the task card, `ChangesDock` for the side panel, `ChangesPanel` expanded;
  `DiffList` is the `@pierre/diffs` `CodeView` with our `DiffFileHeader` as each file's header,
  the "nex" CSS-variable syntax theme and the `.nex-diff-list` overrides in `globals.css`;
  selecting line numbers opens `SelectionAsk`, `ChangedFileList`; labels in `lib/diff-range.ts`), `notes/` (`NotesView`
  autosaves with "Saved · 2m ago" and "Send to Claude"; `NotesEditor` is tiptap with markdown
  in and out (`@tiptap/markdown`) — only what markdown can store, so no text color or underline —
  to-do lists and a `FormatToolbar` bubble on selection), `terminal/`
  (`ShellView` = `TerminalTabs` + one `TerminalSurface` (xterm) per terminal, themed from the
  palette by `lib/terminal-theme.ts`), `browser/` (`BrowserPanel` = `BrowserTabs` (with the
  `BrowserMenu`) + `AddressBar` + `ClaudeBrowsingBanner` + `BrowserViewport` (desktop or phone, green
  ring while Claude drives); overlays `ElementHighlight`, `ClaudeCursor`, `AnnotateToolbar`; the
  page itself is a slot — the real `<webview>` comes when it is wired), and the composer's
  `ElementCard` attachment for a picked element, `session/` (`SessionStrip`, `SessionChip`, `SessionPopover`; `TaskSessionStrip` wires the four chips —
  environment, session, context, connectors — to `EnvironmentPopover`, `SessionInfoPopover`,
  `ContextPopover`, `ConnectorsPopover`), `task-view/` (`ExpandedTaskView` lays out header, strip,
  `TaskChat` and the `TaskDock` side panel, which can expand to full width; `TaskViewHeader`), `home/`
  (the sidebar's Overview and Tasks links switch `homeView` in `workspace.store.ts`; opening a task goes to Tasks; `AgentStrip`, the Tasks view — freely scrolling task cards with the previous one peeking, `StripSummary` in a glass pill and a
  scroll map, over the same full-window scene (`HomeBackdrop`) — `HomeHero`, the Overview in `routes/home.tsx`: the greeting, `HomePrompt`
  (a title plus the new task fields — `TaskFieldRows`, which wrap to a second row, over `hooks/use-task-fields.tsx`, shared with
  `NewTaskDialog` — that starts the task directly; `AppHomePrompt` wires it through `hooks/use-new-task-launcher.ts`,
  which `AppNewTask` uses too) and `HomeStats` (`HomeStat` tiles: tasks by state, which opens Tasks, spend today, the usage limit and environments; `lib/home-stats.ts`, counts in `lib/task-status.ts`) over `DitherScene`; the route renders one `HomeBackdrop` for Overview and Tasks (so switching never redraws it, `HomeHero backdrop={false}`), which `fullWindow` portals into the app shell's backdrop layer
  (`layout/app-backdrop.tsx`) with `ChromeGlass` (`layout/chrome-glass.tsx`), one blurred `bg-page-glass` layer clipped to the
  titlebar and sidebar so the blur runs on without a seam (titlebar and sidebar themselves have no background); `TasksEmpty` (Tasks with nothing running) and
  `AddAgentSlot`, the dashed card next to the only task), `new-task/`
  (`NewTaskDialog` over a `scrim`: title, details and `FieldPill`s for project, base branch, agent,
  model and mode; the branch name comes from the title via `lib/task-branch.ts`; `AgentPicker`,
  `ProjectPicker`, `BranchPicker`), `usage/` (`UsagePanel` opens from the titlebar's `UsagePill`:
  `AccountSwitch`, `SessionLimit` with the projected end of the window, `SpendTrend` sparkline and
  the tasks that spent it; tones and the sparkline math live in `lib/usage.ts`), `command/` (`CommandPalette` — ⌘K over a
  scrim with tasks, files and actions; ranking in `lib/command-search.ts`; ↑↓ moves one sliding
  highlight, ↵ opens, ⌘↵ opens in a split), `settings/` (`SettingsPage` — the `/settings` route (titlebar gear, ⌘,), controlled: `AppSettings` feeds it the
  real data and writes `preferences.store.ts` (`lib/preferences.ts` holds the defaults; main reads the
  same `preferences` setting for quit, shell and extra agent arguments); one page built from section
  data so search (`lib/settings-search.ts`) filters rows and drops empty sections; only options that
  do something are listed; `SettingsIndex`
  follows the scroll with a sliding marker and jumps on click; `AccountList` + `RemoveAccountDialog`,
  `WorkspaceCard`, `RuntimeCard` (Apple container, `.nex` addresses, ports other apps hold, Restart and Repair) + `RemoveEnvironmentsDialog`, `ShortcutRow` records a new shortcut (`lib/shortcut.ts`);
  `LicensesView` + `LicenseSheet` read `assets/licenses.json`; defaults and options in
  `settings-values.ts`; its dialogs use `Overlay fullWindow`, which portals to the body so the scrim covers the whole window and the dialog sits in its center),
  `onboarding/` (`OnboardingFlow` runs Welcome and the five steps — `AgentStep` (ready, signed out,
  missing), `WorkspaceStep`, `ProjectStep`, `EnvironmentsStep` (offer, running,
  ready, unsupported, failed), `FirstTaskStep` — over `OnboardingChrome` and the `OnboardingStep`
  layout (⌘↵ runs the primary action); `AddAccountDialog` covers every sign-in stage; `CheckList`
  and `OnboardingPanel` are shared; environment progress and sign-in come in from props), `projects/`
  (`AddProjectDialog`: `RepoDropZone` + `FoundRepos` (repos from `native/git/discover.ts`) + `AppCloneRepo` / `CloneRepoPanel` (GitHub through `gh`, or a git URL), then `PickedRepo` and one `SetupSection` per
  line — `BranchEditor`, `WorktreeSetupEditor`, `EnvironmentEditor` (`projects/environment-editor.tsx`:
  one sentence and a test status line with "Test it", issues folded into one line, services as
  `ServiceChip`s grouped "You open" / "Runs in the background" / "Data" (`serviceRole`; the Data
  group ends with a "Seed and migrations" disclosure), a chip opens its
  `ServiceDetail` (`projects/service-detail.tsx`: command and memory, "Opens at" `<short>.{task}.nex`, the rest under Advanced) below
  its group; Add service and Detect again at the bottom; helpers in `lib/project-environment.ts`), `QuickCommandsEditor`; the dialog never grows past the window: header
  and actions stay put and the body scrolls (`quiet-scroll`), for adding, editing and onboarding; each
  line's sentence comes from `lib/project-summary.ts`; the base branch, pull and worktree setup are saved on the
  project and `native/git/start-work.ts` applies them: start from `origin/<base>`, copy files, run install and
  script in a "Setup" shell), `environment/` (`EnvTaskButton` = the tab bar
  `EnvButton` (running, starting, paused, down, waiting) + `EnvMenu` (a service whose port another app
  holds shows it in orange); `EnvBanner` under the tab bar for starting, paused, a service down,
  waiting for memory or a published port in use (`EnvBannerSlot` opens and closes it by height); `EnvStartStatus` inside
  `TaskEmptyState` (`BootStatus`: the effort slider's `DitherField`, mirrored, behind the label and count); `EnvironmentsMeter` in the sidebar footer opens `MachinePopover` (memory used by Nex containers against the memory budget);
  `AddressStatus`; closing a task is `task/close-task-dialog.tsx`, which lists the
  environment's data and address; `environment/app-task-environment.tsx` (`AppEnvButton`, `AppEnvBanner`,
  `AppEnvStartStatus`) wires them to the task states in `environments.store.ts`, mapped by
  `lib/task-environment.ts`). They take plain props; outside the environment pieces nothing is wired to the
  stores yet.

The other beautiful-ui primitives are still in their original look and are not shown anywhere yet.

**Living style guide:** `routes/design-system.tsx` (dev only — palette icon in the titlebar) shows
only what matches the wireframes: colors, typography, radii, shadows and every restyled component
(`components/design-system/`). Add a specimen when a component is restyled or added.

### Theming

All colors use CSS variables defined in `globals.css`. Never hardcode colors in components; the
only exception is inline `style` for dynamic colors passed as props (e.g. workspace color).

- The palette lives in `:root` (light) and `.dark` (the wireframe palette — the default). **A theme
  only overrides these variables**, and `@theme inline` turns them into utilities:
  surfaces `page` · `canvas` · `surface` · `surface-raised` · `elevated` · `inset`; fills `field` ·
  `hover` · `hover-2` · `glass` · `page-glass` · `surface-glass`; ink `ink` … `ink-6`, `inverse`; lines `line-soft` · `line` ·
  `line-chip` · `line-strong` · `line-focus` · `ring-idle`; brand `accent` (logo green #33843F) ·
  `accent-hover` · `accent-ink` · `accent-tint` · `on-accent`; semantic `green` · `orange` · `red`
  (`red-solid` for filled) · `blue` · `violet`, each with a `-tint`; identity `claude` · `claude-tile`; overlay `scrim`.
- Type scale: `text-3xs` 10 · `2xs` 11 · `xs` 12 · `sm` 13 (body) · `base` 14 · `md` 15 · `lg` 16 ·
  `xl` 20 · `2xl` 24 · `3xl` 30. Radii: `rounded-chip` 6 · `control` 8 · `field` 10 · `menu` 12 ·
  `panel` 14 · `sheet` 18 · `card` 22 · `full`. Shadows: `shadow-hairline` · `btn` · `solid` · `tab` ·
  `track` · `card` · `raised` · `overlay` · `modal` · `focus`.
- **Themes:** the active theme is the `dark` class on `<html>`, set by `applyTheme` in `lib/theme.ts`.
- **No gradients or colored backgrounds.** No aurora/blob washes, glows, or gradient-filled buttons and
  tiles — surfaces are flat tokens, depth comes from surface steps, rings and shadows only.
- **Monospace is for code only:** code blocks, inline code, the terminal, diffs, tool output, shell commands
  and CLI arguments. Paths, branches, file names, tab names, chips, versions, times and other metadata use
  the regular font (`tabular-nums` for numbers that change).
- **Never use uppercase text** anywhere in the app — no `uppercase`, no all-caps copy, no wide tracking
  on labels. Section labels are sentence case ("Workspaces", not "WORKSPACES").

Keep in sync when changing the palette:

- The pre-React skeleton in `index.html` repeats the `#shell` background inline (it paints before
  Tailwind loads).
- `lib/theme.ts` `getTheme()` feeds third-party renderers that cannot read CSS variables.

### Motion

Motion is CSS only, respects `prefers-reduced-motion` (handled in `globals.css`) and should feel like
beautiful-ui everywhere:

- **Every clickable gets `interactive press`.** `interactive` is the 150ms ease-out transition for
  color, fill, ring and scale. The press scale depends on size, so every element shrinks about the
  same few pixels: `press` (0.97) for small controls, `press-wide` (0.985) for rows, fields and wide
  pills, `press-large` (0.995) for cards. Never on disabled controls.
- **Lists and menus use `GlideMenu`**: one hover layer that slides between `data-menu-row` rows,
  instead of a hover fill per row (menus, sidebar links and task lists, the rail, popover actions).
- **Tabs and segmented controls slide their thumb** (`useSlidingThumb` + `glide-thumb`).
- **Overlays enter, never pop:** menus, popovers and dialogs use `enter-pop`, toasts `enter-toast`.
- **Nothing appears on hover without a transition:** an action that replaces a row's detail on hover
  goes through `HoverSwap` (cross-fade and a small scale, in step with the glide); anything else
  revealed on hover fades with `transition-opacity`.
- Rotations and toggles animate (chevrons, the switch knob); long-running agent states use `Shimmer`
  or `Orbit`.
- Focus is a 2px outline that follows the element's radius; fields use `shadow-focus`, and `GlideMenu`
  rows show focus with the sliding highlight instead of an outline.

### Titlebar

The app uses `titleBarStyle: 'hiddenInset'` for native macOS look. `layout/titlebar.tsx` is a 48px
drag region; its contents are being rebuilt from the wireframes (see Design Reference).

All interactive elements inside the titlebar must have `WebkitAppRegion: 'no-drag'`.

### Agent

Each task runs Claude Code headless, one process per task, in `native/agents/agent-runner.ts`:
`claude --print --input-format stream-json --output-format stream-json --include-partial-messages
--permission-prompt-tool stdio`, with `--session-id` for a new conversation and `--resume` after.

- **In:** user messages and control requests (`initialize`, `interrupt`) as JSON lines on stdin.
- **Out:** every line is forwarded as `AGENT_EVENT`; `stream_event` deltas are the live text, and
  `result` ends the turn (`AGENT_STATE`). `can_use_tool` control requests become Nex permission
  cards (`agents/permissions.ts`); "Always allow" returns Claude's own `permission_suggestions`.
- **History** is the transcript Claude writes (`agents/transcript.ts`); live messages carry the same
  `uuid`, so `lib/agent-live.ts` merges both without duplicates.
- **Composer chips:** model and permission mode change live (`set_model`, `set_permission_mode`);
  effort only exists as a flag, so the process restarts between turns. Saved per task in
  `agents/agent-settings.ts`, which also maps the composer's ids to the CLI's.
- **Questions and plans** arrive as `can_use_tool` for `AskUserQuestion` and `ExitPlanMode`; they render as
  `QuestionCard` / `PlanApproval` and answer with `updatedInput` (`answers`, or `response` when typed).
- **Messages sent while Claude works** wait in the renderer as `QueuedMessage`s and go out together when
  the turn ends; "Send now" interrupts.
- **Models** come from Claude Code itself: the `initialize` response lists them with their effort levels
  and Auto support (`agents/agent-models.ts`, cached in settings); `composer/models.ts` `MODELS` is only
  the fallback before any agent has started, and `resolveModel` maps older saved ids.
- **Versions:** `lib/claude-version.ts` holds the minimum Claude Code Nex supports and the one it was
  tested with; bump `TESTED_CLAUDE_VERSION` after checking a new release. A control request the CLI
  answers as unsupported is remembered and skipped; model or mode changes it refuses apply on restart.
- **Expired account tokens** are renewed by Nex with the refresh token Claude Code stored, through Claude
  Code's own OAuth client (`usage/credentials.ts` `refreshCredentials`), and written back to the same
  keychain item; "Sign in again" only logs in from scratch when that refresh fails.
- **Background commands** Claude starts are tracked in main from its task events
  (`agents/background-commands.ts`) and listed read-only under "Started by Claude" in the quick commands menu.
- **Sent messages** are parsed back into pills and pasted-text cards by `lib/user-message.ts`; attached
  images carry their file name as an `[Image N: name]` line that the chat strips from the bubble.
- **MCP servers** are added with `claude mcp add` through `mcpAdd` (`agents/mcp-servers.ts` builds the args).
- **Subagents and workflows** (verified on 2.1.322): `task_started` / `task_progress` / `task_updated` /
  `task_notification` for `local_agent` and `local_workflow` are kept per task by `agents/agent-tasks.ts`
  (pure) and `agent-task-tracker.ts` (`AGENT_TASKS`); a workflow's `workflow_progress` lists its phases and
  agents. `SubagentCard`, `ParallelAgents` and `WorkflowCard` show them live with Stop (`stop_task`); the
  `SubagentSheet` reads a subagent's own transcript, `<session>/subagents/agent-<id>.jsonl`, found by the
  `toolUseId` in its `.meta.json`. Background agents and workflows also list under "Started by Claude".
- **Ultracode** is Claude Code's session mode, not an effort: the composer's Ultracode step runs `--effort max`
  with `--settings {"ultracode":true}`, and switching it on or off mid-task sends `apply_flag_settings`.
- **Continuing a Claude Code session:** `agents/claude-sessions.ts` lists the CLI conversations of a project's
  folder (not ones a task already owns); picking one in the "New chat" pill copies its transcript into the
  task's worktree folder and the agent starts with `--resume`.
- Never drive the agent through a pty or by simulating keys.

### Environments

Tasks run their services on native Apple container (`native/environments/`): every service is its
own container, so its own micro-VM with its own IP on `192.168.64.0/24`. No Linux machine, no Docker;
images a project builds come from Apple container's own builder. Nothing is published by Apple
container; the Mac reaches every task through Nex's own proxy (`proxy.ts`), so tasks never collide.

- **Setup** (`service.ts`, steps in `setup-steps.ts`): install Apple container (signed pkg from
  GitHub), start it with `--enable-kernel-install`, register `.nex` addresses, then run a throwaway
  container and check that its `nexsvc` alias answers on Apple's DNS, from the Mac and inside the
  container (`getent ahostsv4` through its search domain), and that a `.nex` name is loopback. Install and `.nex` share one password prompt; a failed step retries from itself; Settings ›
  Environments "Repair" re-runs the registration (existing installs show ".nex addresses off" until then). Setup also removes what the old Linux-machine version left (`nex` machine, `nex-machine`
  images, its builder and folders).
- **Labels:** everything Nex creates carries `nex=1` (`labels.ts`), plus `nex.task=<id>` per task;
  status, memory use (`container stats`) and uninstall only ever look at labelled containers and volumes.
- **Nex DNS** (`nex-dns.ts`, packets pure in `dns-packet.ts`, resolver file in `resolver-file.ts`): a
  UDP server in main on `127.0.0.1:53535` (or the next free one up to 53544, kept in the `nexDnsPort`
  setting). `/etc/resolver/nex` (`nameserver 127.0.0.1`, `port`, `search_order 1`) sends the Mac's
  `.nex` lookups to it. Every `.nex` name answers `127.0.0.1` / `::1` (TTL 5 s); names outside `.nex`
  are NXDOMAIN.
- **Two domains, never one** (verified on 1.7.1): containers ask the gateway `192.168.64.1`, which
  answers aliases only inside a domain registered with `container system dns create`; an alias in an
  unregistered domain answers on 2053 from the Mac but is NXDOMAIN inside containers. Apple's
  `/etc/resolver/containerization.<domain>` wins over Nex's file whatever its `search_order`, so a
  registered `nex` handed the Mac container IPs for `mailpit.<task>.nex`. Discovery lives in its own
  domain, `nexsvc` (`DISCOVERY_DOMAIN`), and `nex` belongs to Nex alone. Registered means Nex's file on
  the current port, `containerization.nexsvc` present and `containerization.nex` gone; one admin batch
  (`dns delete nex`, `dns create nexsvc`, Nex's file; with the install when both are needed), which is
  also what Repair runs. Uninstall removes all three files.
- **Service discovery** (verified on 1.7.1): every service of a task gets the alias
  `<service>.<task>.nexsvc`, and every container of that task runs with `--dns-search <task>.nexsvc`,
  so the names a project already uses (`db`, `redis` in `DATABASE_URL`) resolve inside the task, each
  task to its own containers. A task whose containers carry another search domain (the older
  `<task>.svc.nex`) is recreated on its next start instead of resumed, volumes kept. There is no
  `--add-host`. Isolation is by name only: every container shares `192.168.64.0/24`.
- **Definition** (`EnvServiceDef` / `ProjectEnvironment` in `db/types.ts`, stored as JSON in
  `projects.environment`): per service `kind` (`image` = a ready image, `build` = an image built from
  the project's Dockerfile, `app` = the project's code on a runtime image, for repos without compose),
  `image`, `build` (`context`, `dockerfile` — both repo paths — `target`, `args`), `entrypoint`,
  `command`, `workdir`, `mounts` (project paths bind-mounted from the worktree), `volumes` (paths that
  get a task volume filled from the image), `ports` (container ports compose published; every port
  is reachable inside the task), `hostPorts` (`{ host, container }` only where compose published a
  different Mac port, `"5173:80"`; missing means the same number, so older data needs nothing), `env`, `envFiles` (read from the worktree at run
  time, so secrets never land in Nex's database), `data` (the directory a task volume keeps), `dependsOn`,
  `ready` (a probe command or a port), `seed`, `memoryMb`. `source` turns `edited` on the first change.
  A project created without one gets it detected in main.
- **Detection** (`detect.ts`, never runs project code): the first of `compose.yaml`,
  `docker-compose.yml` and their `.local` / `.dev` variants (`detect-compose.ts`, faithful to compose:
  `.env` interpolation, YAML anchors and merge keys, `build` → a `build` service, `env_file`,
  `environment`, `command` / `entrypoint` (string or list), `working_dir`, `healthcheck` → `ready`,
  `ports` → container ports plus host ports (`"5173:80"`, `"8000"`, `ip:host:container`, `[::1]:…`,
  `/udp`, equal-length ranges, long syntax; anything else becomes a warning),
  bind mounts inside the project → `mounts` (`:ro` kept, `:z` dropped), anonymous and named volumes →
  `volumes`, the named volume of a known data store → `data`; `stdin_open`, `tty`, `container_name`,
  `networks` and `restart` are ignored and proxies like traefik dropped; `depends_on` only orders,
  since the check waits for each service to be ready);
  otherwise the stack (`detect-stack.ts`: `package.json` dev script, lockfile, `.nvmrc`/`engines`,
  framework ports, `--host 0.0.0.0` for vite-like servers, database URLs in `.env.example`, Procfile,
  seeds). Anything Apple container can't do becomes a warning in the editor; the editor drops a
  warning about a service that already has a validation error, so a problem never shows twice.
- **Translation** (`translate.ts` `toContainerRuns`, pure): `volume create` and `run` args in
  `dependsOn` order (a cycle throws): `nex-<task>-<service>`, labels `nex`, `nex.task`, `nex.project`,
  `nex.service`, at least 256 MB. App services mount the worktree at `/workspace`, run their command
  through `--entrypoint sh -c` (not `-l`: a login shell resets the image's `PATH`) and, on node or bun,
  get a `node_modules` volume so the container's install never touches the checkout; installs are
  `--frozen-lockfile` / `npm ci` so lockfiles aren't rewritten. `build` and `image` services mount only
  their `mounts`, and pass `command` as words after the image's entrypoint, like compose (`entrypoint`
  → `--entrypoint` plus the rest as arguments). Data directories are named volumes; postgres gets
  `PGDATA=<data>/pgdata` and mysql `--datadir`, because volumes have `lost+found` at the root.
- **Volumes start empty** (verified on 1.7.1): neither a named volume nor `-v /path` gets the image's
  files at that path, unlike Docker, so a `- /app/.venv` under `./triton:/app` would hide the deps the
  build installed. Each `volumes` path gets `nex-<task>-<service>-<n>`, filled before the service starts by
  a throwaway `run --rm --user 0:0` of the same image that `cp -a`s the directory in and deletes
  `lost+found`. Never use `-v /path`: Apple creates an unlabelled volume that survives `--rm`. A mount
  point under a bind mount is created in the worktree, as Docker does.
- **Builds** (`build.ts`): `container build --progress plain` from the project's main checkout, tagged
  `nex-<project>-<service>:<hash>` and reused by every task. The hash covers the project path, the build
  section, the Dockerfile and what it copies in that is a plain file (entrypoint scripts) or a known
  manifest or lockfile in a copied folder — not the code, which dev setups bind-mount. Services with the
  same build section (anchors) share one build; after a new build the previous tag of that service
  (`nex.build` label) is removed. The first build starts Apple's `buildkit` builder VM (defaults: 2 GB).
- **Check** (`check.ts`): runs the plan once against the project's main checkout as task
  `check-<project>` with `nex.check=1`, streams building (with the current `#N [stage x/y]` step) /
  pulling / starting / ready / failed per service (`ENV_CHECK_PROGRESS`) and always removes the
  containers and volumes afterwards; built and pulled images stay.
- **Memory:** `envMemory` is the budget every environment shares (the task queue enforces it);
  changing it restarts nothing. Each container needs at least 200 MiB.
- **No shared data:** every task is a new, isolated environment. Its databases start empty and are
  migrated and filled by its own code, never copied from the main checkout or another task (a copy made
  with one version of the code breaks a task on another, as submodules ahead of their recorded commit
  showed). Volumes an older Nex kept for this (`nex.base` label, `nex-base-*`, `nex-next-*`, the
  `cleanBases` setting) are deleted once at startup (`removeCleanBases`).
- **Prepare steps** (`prepare`, `taskPrepare` on the environment, helpers in `env-steps.ts`) run with
  `container exec` through the image's entrypoint and working directory (the cookiecutter entrypoints
  export `DATABASE_URL`). `taskPrepare` (migrations) runs on every start, right after its service is
  ready; `prepare` (seeds) runs once, in order, after every service is up, when the task's data volumes
  are new. Until it finishes the stored record carries `seeded: false` (written before it starts, as a
  failed start, so quitting mid-seed counts), and the next start deletes the task's data volumes and
  seeds again from scratch. Data services, services with steps and services whose start command
  migrates (`migratesOnStart`) get strict readiness, so steps never race the server's own migrate. Every
  non-app service mounts the worktree read-only at `/nex-project` (SQL seeds).
  Detection (`detect-prepare.ts`): migrations for Django, Rails, Prisma, Alembic, Knex and Sequelize as
  `taskPrepare` unless the start command or the script it runs (a Dockerfile `COPY` to that path, a
  package script) already migrates; Prisma seeds, `seed.file` SQL loaded with `psql`/`mysql`, and
  `Makefile` targets named `*seed*` that `run`/`exec` one of the services, as `prepare`.
- **Task environments** (`task-env.ts`, pure parts in `task-env-plan.ts`): each task gets a DNS-safe slug
  of at most 20 characters (`sessions.env_slug`), from its name without the `-2` a taken branch added
  (`slugSource`), `-2`… only when a task that still exists (or one being deleted) holds it, so a closed
  task frees its slug; never `check-`. Existing tasks keep theirs. Start =
  build missing images under the shared lock, run every service against the task's worktree with its
  own empty data volumes, `taskPrepare` after its service is ready, then `prepare` when the data is
  new; readiness soft for the rest (a service with ports and no probe gets a port probe that only
  notes "not answering yet"). The empty state shows "Filling its databases" while `prepare` runs. States `queued` · `starting` · `running` · `paused` · `down` (service, exit
  code from `container logs --boot`, last log line) · `failed` · `none`; the result is kept in the
  `taskEnvironments` setting and reconciled with `container ls` by `nex.task` when Nex starts (all stopped
  → paused, resumes on open). Pause stops apps, then data stores (postgres `SIGINT`); resume starts in
  dependency order, each after its dependencies answer; a failed environment is recreated (volumes
  kept) instead of resumed. Closing a task deletes everything with its `nex.task` label.
- **When:** on task creation if `envStartOnCreate`, otherwise the next time the task is opened or its
  first message; never blocking either. The new task dialog's Environment switch (`FieldToggle`, only for projects
  with an environment) creates a task with `sessions.env_off`: nothing starts it by itself and Claude gets no
  note; the tab bar globe (`EnvButton` `off`) or the empty state's "Start it" starts it, clears the flag and restarts
  the agent between turns so it gets the note. The renderer reports the viewed task (`viewTaskEnvironment`).
- **Queue and budget:** at most `envRunAtMost` environments starting or running, and new ones must fit
  `envMemory` counting `container stats` of running Nex containers plus the limits of environments still
  starting; the first one always starts. Otherwise `queued` with the oldest unused task as "Pause X now";
  pausing, deleting or finishing a start advances the queue (and every 15 s poll).
- **Idle pause:** after `envPauseAfter` minutes (`never` turns it off) with no agent activity and not
  being viewed; opening the task or sending a message resumes it. Idle for 5 min marks it idle in the
  machine popover.
- **Addresses and the proxy** (`proxy.ts`, routing and rewrites pure in `proxy-routing.ts`): Node
  `http` plus raw sockets in main. "You open" services (`serviceRole`) get `http://<short>.<task>.nex`;
  the main one (`mainService`: a `web`/`front`/`ui`/`app`… name, else the first one you open) gets
  `http://<task>.nex`. `<short>` drops a dash prefix several services share (`triton-django` →
  `django`; `shortNames`, only when it stays unique and a valid label); container names and aliases
  keep the full name. `*.localhost` routes identically and is the fallback: the main address when
  `.nex` isn't registered, and the menu's ".localhost" action per address (Chrome's secure DNS skips
  `/etc/resolver`). `TaskEnvService` carries `url` plus `localhostUrl`.
- **Open with:** a service you open that publishes a host port gets `localPort` (data services too). Its
  menu row opens the task address; a chevron (`OpenWithMenu`) lists that address, then
  `http://localhost:<host port>`, which follows the task you view so sign-in and cookies work as with
  compose (`.localhost` instead when the port is blocked), and Copy link. Opening from a task marks it
  viewed first (`useOpenInTask`).
- **Port 80, loopback only:** an unprivileged process can't bind `127.0.0.1:80` on macOS 26, only the
  wildcard, so the entry listens on `0.0.0.0:80` and `[::]:80` and destroys every connection whose
  remote address isn't loopback (`isLoopback`) before reading a byte. If 80 is taken or refused it
  falls back to `ENTRY_PORT` 1355 (next free up to 1364) on `127.0.0.1`/`::1`, and only then do
  addresses show the port. A packaged build may make the macOS firewall ask once to allow incoming
  connections; denying it doesn't matter, since only loopback is served.
- **Host ports:** while an environment is starting, running or down, Nex also listens on every host
  port its services publish (`8000`, `1234`, `5173`…), like compose did. Routing per request: a
  `<short>.<task>.nex` (or `.localhost`) Host picks the task directly (on the entry port, the
  service's web port; on a host port, the service publishing it); otherwise the page's `Origin` (else `Referer`) names the
  task; with neither (a typed URL, curl) it's the task being viewed, else the newest. The service is the
  one publishing that host port, forwarded to its **container** port (`5173` → `80`). WebSocket
  upgrades route the same way. The container's IP is looked up per connection (`container inspect`,
  cached 2 s, dropped on every start, pause and restart); a refused connect is retried once with a
  fresh lookup, so a resume's new IP is invisible. A non-HTTP first packet (debugpy) is piped raw to
  the fallback task.
- **Database ports** (`speaksRaw`, `rawPort`): a host port published by a data service (postgres,
  mysql, redis, mongo…) or on a non-web port (SMTP `1025`) is piped raw at once, without waiting for a
  first packet, to the task you're viewing, else the newest running one, so TablePlus or `psql` on
  `localhost:5432` reach the viewed task and server-first protocols (SMTP, MySQL) work. Only ports the
  compose publishes; conflicts and release work like every host port. The menu shows
  `localhost:<port> · while you view this task` (`localPort`).
- **Looking like compose:** the forwarded `Host` is `localhost:<host port>`; `Origin` and `Referer` from
  a task address become the compose origin of that service (`http://taska.nex` →
  `http://localhost:5173`). Responses get `Access-Control-Allow-Origin` back to the real page when it
  echoes the rewritten origin, and a `Location` at `localhost:<host port>` turns into that service's
  task address in the domain the request came in on, `.nex` or `.localhost` (only for requests that
  came in through a task address). Bodies are never touched.
  Cookies without `Domain` stay host-only: `localhost` cookies are shared across tasks, as with compose,
  and a page on `*.nex` or `*.localhost` calling `localhost:8000` is cross-site, so `SameSite` cookies and
  `document.cookie` from the API don't reach it (use `localhost:<port>` for the viewed task for those).
- **Port conflicts:** Node sets `SO_REUSEADDR`, so binding `127.0.0.1:8000` succeeds even when Docker
  holds `*:8000` and silently shadows it. Nex first connects to the port on both loopbacks; if anything
  answers the port is blocked ("Port 8000 is used by another app" in the task's banner and menu and in
  Settings, `EnvironmentStatus.blockedPorts`), the other ports keep working. Every 15 s poll `lsof`
  finds apps that bound one of Nex's ports later (Nex lets it go) and blocked ports are tried again.
  A port nobody running needs is closed; the entry port stays open while any task has an environment
  (a paused task answers "paused").
- **Env files:** a worktree lacks gitignored files like `oberon/.env`. At task creation
  `native/git/env-files.ts` copies from the main checkout every file the environment names in
  `envFiles` plus the `.env*` files `git ls-files --others --ignored --exclude-standard` lists in each
  service's code root (app root, build context, mount sources; run inside nested repos and submodules),
  only when missing in the worktree, never overwriting, at most 50. The worktree setup line says so.
- **Hot reload** (verified on 1.7.1): file events on the Mac never reach a container's inotify through a
  virtiofs bind mount. Nex watches each running task's worktree (skipping `.git`, `node_modules` and
  build dirs), debounces 150 ms, maps paths through the writable mounts and runs one batched
  `container exec <name> sh -c 'for f; do touch -c -r "$f" "$f"; done'` per container (deleted files
  touch their folder); the guest sees the change with fresh content (~60 ms). A plain `touch` changes
  the file's time on the Mac and loops back into the watcher; `-r` keeps it, and events whose mtime
  matches what was touched are dropped as echoes.
- **Claude knows its environment:** `agentEnvironmentNote` (pure, in `task-env-plan.ts`) lists each service
  with its task address, its in-task names and container, and how to `exec` and read logs; the agent gets it
  through `--append-system-prompt` (`setAgentSystemNote`, registered by `initTaskEnvironments`), so it uses
  the task's addresses instead of `localhost` and never starts the services itself. It applies on the next
  agent start.
- **Logs in Shell** open a terminal tab running `container logs -f` (one service, or all prefixed).
- Every container boots its own kernel with 8k inotify watches, too few for dev-server file watchers, so
  service runs pass `--kernel-arg sysctl.fs.inotify.max_user_watches=524288` (and `max_user_instances`).
- Apple container 1.7.1 never creates `content/blobs/sha256` after a fresh install, so the first pull
  fails: `ensureContentStore()` runs before any pull or build.
- **Uninstall** stops the system before running Apple's uninstall script (running containers and the
  builder are left orphaned otherwise) and batches removing `/etc/resolver/nex` and Apple's
  `containerization.nexsvc` (and an old `containerization.nex`) with the script in one admin prompt; the runtime goes only when Nex installed it.

### Diff viewer

The diff is rendered by `@pierre/diffs` (`CodeView`) in `components/changes/diff-list.tsx`, styled to
the wireframes. Pierre mixes each `--diffs-bg-*-override` in at about 20% over the background, so the
overrides are mix targets, not the final colors. Never set `scrollbar-width`/`scrollbar-color` on or
inside `.nex-diff-list`: Chromium then drops the `::-webkit-scrollbar` rules Pierre measures. Use
`CodeView`, not the standalone `FileDiff` (it renders an empty `<pre>` here). Virtualization is turned off on
purpose (`DiffList` sets an overscan taller than any diff): measuring files as they scroll in made
the list jump; the estimates in `ITEM_METRICS` still have to match the header and line heights. Git data is not wired
yet; when it is, these rules from the previous version apply:

- **What it shows:** everything the session changed — `merge-base(baseBranch, HEAD)` through the
  working tree, so commits made inside the worktree count, plus staged, unstaged and untracked
  files. Built in `native/git/git.ts` (`getWorktreeDiff`). A path staged as deleted and then
  recreated would otherwise appear twice, so untracked files already present in the tracked diff
  are filtered out — the renderer keys files by path and needs them unique.
- **Refresh:** `native/git/watcher.ts` watches the worktree (recursive, skipping `node_modules` and
  build dirs) plus its git dir for commits, debounced, and pushes `GIT_WORKTREE_CHANGED`. The
  renderer subscribes through `hooks/use-worktree-diff.ts`. There is no polling.
- **Re-render contract:** `CodeView` only re-reads an item when its `version` changes, and Pierre
  only re-highlights when the `cacheKey` changes. `diff.store.ts` therefore hashes each file's
  content into a version and derives the cache key from it; `diff-viewer.tsx` folds the collapsed
  flag into that same number. Passing a fresh `FileDiffMetadata` with an unchanged version renders
  **stale content** — the version is what makes an edit visible.
- **Expanding context:** a patch only carries the lines around each hunk, so `loadDiffFiles` reads
  both full versions of the file back through IPC. Unchanged files keep their previous metadata
  object so already-hydrated context survives a reload.
- **View state:** `diff-view.store.ts` holds the persisted prefs (split/unified, word diff,
  whitespace, file tree) and the per-session set of collapsed files. Collapsing is per file,
  driven by clicking its header.

### Stores

Always use individual selectors (`useSettingsStore(s => s.theme)`) — never subscribe to a whole store.

### Shortcuts

Never add a raw `keydown` listener for a shortcut.

- **App-wide shortcuts** live in `lib/app-shortcuts.ts` (`DEFAULT_SHORTCUTS`, TanStack notation such as
  `Mod+Shift+N`) and are registered with `useAppHotkey(id, callback)`. Settings lists and records them
  from the same list (`ShortcutRow` uses `useHotkeyRecorder`).
- **Shortcuts that belong to one dialog or view** (Esc, ⌘↵ in the new task dialog) use `useHotkey` with
  `target` set to that element's ref, so two instances never collide.
- Shown keys come from the list too: `shortcutLabel(id)` for inline hints, `hotkeyCaps(hotkey)` for
  `KeyCaps`. Never hardcode "⌘T" in a component.

### Routing

`App.tsx` builds a `createMemoryRouter` (react-router 8 data router, in memory because Electron has no URL bar). `layout/app-shell.tsx` is the root route element and renders the page through `<Outlet />`. Routes are in `web/routes/`.

### Releases

Versioning uses Changesets 3 (`.changeset/config.json`, `baseBranch: main`, private package with
version and tag on). Pushing to `main` never ships anything by itself.

- **Every push to `main`** runs `release.yml`: first `checks.yml` (frozen install, `pnpm check`,
  typecheck, `vp test --run`, `electron-vite build`), then `changesets/action` opens or updates a PR
  titled **chore: version packages** with the next version in `package.json` and the new
  `CHANGELOG.md` section.
- **Merging that PR is the release:** the workflow tags `vX.Y.Z` and creates the GitHub Release with
  the changelog. Nex has no auto-updates for now, so nothing builds or publishes the macOS app.
- **Never edit `CHANGELOG.md` or the version in `package.json` by hand:** the version PR owns both.

#### Changesets: Claude writes them

Every change that a Nex user would notice ships with a changeset written by Claude without being
asked, next to the code it describes: `.changeset/<kebab-case-slug>.md` with

```md
---
"nex": patch
---

We improved how fast the task view opens.
```

- `patch` for fixes and small improvements, `minor` for a new feature or screen, `major` only when a
  user has to do something (reinstall, sign in again, recreate a workspace) or Nex drops support for
  something.
- One sentence **in English, for users**, written like the release notes of a consumer app: general
  and about the benefit, in the first person plural ("We improved…", "New option to…", "We fixed an
  issue where…"). Name the area (home, tasks, changes, browser, environments, settings, onboarding)
  but never the mechanism: no files, functions, stores, IPC channels or libraries.
- Several user-visible changes are several changesets, one per change.
- Internal work (refactors, CI, dependencies, docs, tests, tooling) gets no changeset, unless a user
  would feel it (it is faster, a crash is gone).

## Conventions

- **File names:** `kebab-case` for all files (`terminal-box.tsx`, `use-app-data.ts`)
- **Components:** `PascalCase` exports (`TerminalBox`)
- **Hooks:** `camelCase` with `use` prefix (`useAppData`)
- **Types/Interfaces:** `PascalCase` (`TaskItemProps`)
- **Constants:** `UPPER_SNAKE_CASE` (`IPC`)
- **Formatting:** Oxfmt with its defaults (`pnpm fmt`). Do not add a Prettier config.
- **Linting:** Oxlint through `vp lint`, rules in the `lint` block of `vite.config.ts`. The project's own rules live in `lint-rules/` as an Oxlint JS plugin (`nex/*`).
- **Tests:** Vitest through `vp test`, importing from `vite-plus/test`. Test files sit next to the code as `*.test.ts`.
- **Interactive elements:** Must have `cursor-pointer`, `select-none` and `interactive` plus the
  press tier that fits their size (`press`, `press-wide`, `press-large`)
- **Path aliases:** `@/` → `src/web/`, `@native/` → `src/native/`. Always use aliases instead of relative imports when crossing boundaries (e.g. `@native/db/types` not `../../native/db/types`)
- **Comments:** See the [Comments](#comments) section. The default is none, and the hard limit is 2 lines.
- **Transitions:** Short and strong (150–250ms, ease-out). No slow fades, no `ease-in` on UI.
- **No hardcoded colors:** NEVER use hardcoded hex colors in components. All colors must use theme tokens from `globals.css`. If a color doesn't exist as a token, create it first. Only exception: inline `style` for dynamic colors passed as props (e.g. workspace color).
- **Long names:** names that come from the user (workspace, project, task, branch, account) never
  wrap and never push a row wider: the text sits in its own `truncate` span with the full name in
  `title`, icons and trailing bits are `shrink-0`. A dialog whose row of pills runs long grows
  first (the new task dialog grows from 820px up to 1040px); only past that does the branch
  pill shrink (`FieldPill shrink`, capped at 260px); project, agent, model and mode keep their full
  label up to 180px (the agent pill shows only the account name when there are several, its logo
  names the agent), and the main action stays `shrink-0`.
- **Native feel:** Global `user-select: none`, `cursor: default`, `-webkit-user-drag: none`. The app should never feel like a website.
- **Reuse the design system:** build UI from `atoms/` and `primitives/` before writing anything new.
- **No inline markup:** Never leave repeated inline JSX when a component can be extracted. If a pattern appears more than once, create a component. Use existing components (`Button`, `Chip`, `StatusPill`, `SegmentedControl`, `GlideMenu`, etc.) instead of raw `<button>` or `<span>` with manual styling. Any new UI pattern (dropdowns, selectors, toggles, etc.) MUST be built as a reusable component in `atoms/` or `primitives/` first, then consumed in pages. Never write raw dropdown/select/picker markup inline — always wrap it in a component.
- **Class merging:** Components that accept a `className` must merge it with `cn()` so callers can override, never with template-string concatenation.
- **No shared folders:** Never create `shared/`, `common/`, or similar catch-all directories for types or utilities. Types live where they are defined and get imported where needed (e.g. DB entity types live in `native/db/types.ts`, preload types in `native/preload/index.d.ts`).
- **No generic IPC:** Never expose raw `ipcRenderer.invoke` or a generic `invoke(channel, ...args)` to the renderer. All IPC must go through explicit functions in the preload bridge (`window.api.*`).
- **Migrations are append-only:** Never modify an existing migration in `migrations.ts`. Always add a new entry to the array. Existing DBs may already have run previous migrations.

## Comments

**The default is no comment.** This is not a style preference to be traded off against
"thoroughness" — a comment is a last resort, used only when the code genuinely cannot carry the
information itself. Assume the reader can read TypeScript.

**Hard limit: 2 lines.** Enforced by `nex/max-comment-lines` in `lint-rules/`, which fails the
build. Consecutive `//` lines count as one comment. If an explanation does not fit in 2 lines, the
comment is not the fix — rename things, extract a function, or let it go.

**Before writing one, try these first, in order:**

1. Rename the variable, function, or component so the name says it.
2. Extract the confusing expression into a named constant or helper.
3. Accept that the reader will read the code.

**Only these earn a comment:**

- A workaround for a third-party bug or constraint, naming the thing worked around.
- A non-obvious ordering or timing requirement that looks safe to change but is not.
- A business rule with no other home in the repo.

**Never comment a prop.** No exceptions. Not the props of a component, not the fields of an
interface or type. If a prop needs prose to be understood, the prop is wrong — rename it, narrow its
type, or split it in two. A union beats a comment (`variant?: 'card' | 'plain'` needs no note),
a named type beats a comment (`anchor?: PopoverAnchor` beats explaining a string format), and two
booleans beat one that means different things in different states. This is enforced by
`nex/no-prop-comments`.

```ts
// wrong — every one of these restates the name or the type
interface Props {
  /** Trailing slot, typically a count badge. */
  trailing?: React.ReactNode;
  /** `card` stands on its own; `plain` is meant for a divided list. */
  variant?: "card" | "plain";
  /** Control aligned to the right of the label. */
  control?: React.ReactNode;
}

// right
interface Props {
  trailing?: React.ReactNode;
  variant?: "card" | "plain";
  control?: React.ReactNode;
}
```

**Never write:**

- What the code does — `// Divider`, `// Footer`, `// Fetch the user`, `// Loop over items`.
- What a component is — `/** Title row for a panel sub-view. */` above `BackHeader`.
- Section banners, decorative dividers, or `// ---- helpers ----`.
- Commented-out code. Delete it; git remembers.
- Restating a type in prose, or JSDoc `@param`/`@returns` that add nothing to the signature.
- Narration of a change — `// now uses X instead of Y`. That belongs in the commit message.

**Editing existing code:** when a comment near your change is wrong, stale, or explains what the
code does, delete it. Leaving it because "it was already there" is how they accumulate.

## Components

Components are organized by function, not dumped into one folder:

- **`atoms/`** — shared building blocks (from beautiful-ui)
- **`primitives/`** — self-contained interface primitives (from beautiful-ui)
- **`layout/`** — app structure (app shell, titlebar)
- **`sidebar/`**, **`home/`**, **`new-task/`**, **`usage/`**, **`command/`**, **`settings/`**, **`onboarding/`**, **`projects/`**, **`environment/`**, **`task/`**, **`task-view/`**, **`composer/`**, **`changes/`**, **`notes/`**, **`terminal/`**, **`browser/`**, **`session/`** — one folder per area of the app
- **`design-system/`** — the dev-only gallery

New feature folders (`sidebar/`, `task/`, `modals/`, …) are created when the first component that
belongs there is written. A generic, reusable piece goes in `atoms/` or `primitives/`; something used
by one area lives in that area's folder.

## Design Reference

The UI design lives in the "Nex 2 — Wireframes" canvas: https://claude.ai/artifact/GbdEmDmeVR2CGVQmXxiqMi
(home strip, task view with session strip + side panel, changes, built-in browser, first run,
settings, usage, task environments, composer states).
