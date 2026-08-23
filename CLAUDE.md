# Nex

Multi-IDE desktop app for managing git worktrees with integrated terminals, notes, and diff viewer per project.

## Tech Stack

- **Runtime:** Electron 39
- **Frontend:** React 19 + TypeScript 5.9
- **Styling:** Tailwind CSS 4 (via `@tailwindcss/vite`)
- **Build:** electron-vite 5 + Vite 7
- **Package:** electron-builder 26
- **Icons:** lucide-react
- **Scrollbar:** simplebar-react
- **Routing:** react-router-dom with `MemoryRouter` (not BrowserRouter)
- **State:** Zustand (hook-based stores in `web/stores/`)
- **Design system:** shadcn/ui (new-york) on Radix UI + `class-variance-authority` + `clsx` + `tailwind-merge`
- **Database:** better-sqlite3 (SQLite in main process)
- **Package Manager:** yarn 1.x

## Project Structure

```
src/
├── native/                    # Electron / Node.js (main process)
│   ├── main/
│   │   ├── index.ts           # App lifecycle, menu, IPC, DB init, updater
│   │   ├── app-window.ts      # Window creation and management
│   │   ├── menu.ts            # Native app menu
│   │   └── updater.ts         # Auto-updates
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
│   ├── App.tsx                # Root component (ErrorBoundary + Titlebar + Sidebar + Router)
│   ├── routes/                # Pages/views
│   │   └── home.tsx           # Main view
│   ├── components/
│   │   ├── layout/            # App structure (titlebar, sidebar, empty-state, active-badge)
│   │   ├── sidebar/           # Sidebar-specific (workspace-item, task-group-header, etc.)
│   │   ├── terminal/          # Terminal-related (terminal-box)
│   │   ├── ui/                # Generic primitives (badge, icon-button, shortcut-key, etc.)
│   │   └── error-boundary.tsx # React error boundary
│   ├── hooks/                 # Custom hooks
│   │   ├── use-app-data.ts    # Hydrates all stores on app mount
│   │   ├── use-fullscreen.ts  # Detect fullscreen state
│   │   └── use-scrollable.ts  # Detect SimpleBar scroll visibility
│   ├── stores/                # Zustand stores
│   │   ├── workspace.store.ts # Workspaces + projects
│   │   ├── worktree.store.ts  # Worktrees
│   │   └── task.store.ts      # Tasks
│   ├── lib/                   # Utilities
│   │   ├── utils.ts           # `cn()` — clsx + tailwind-merge (used by every ui/ component)
│   │   └── status.ts          # Status types and badge mappings
│   ├── assets/                # Images, SVGs
│   │   └── logo.svg     # Nex logo
│   ├── styles/
│   │   └── globals.css        # Tailwind + theme variables + scrollbar styles
│   └── types/
│       └── env.d.ts           # Vite types
│
├── build/                     # Build & packaging config
│   ├── electron-builder.yml   # Electron builder config
│   ├── dev-app-update.yml     # Auto-update config (dev)
│   ├── entitlements.mac.plist # macOS entitlements
│   └── icon.icns / .ico / .png
│
├── scripts/
│   └── resign.js              # macOS ad-hoc re-signing (afterSign hook)
│
└── .claude/skills/            # Agent skills (frontend-design, vercel patterns, etc.)
```

`components.json` at the repo root is the shadcn CLI config (aliases point at `src/web`), so
`npx shadcn@latest add <component>` drops new primitives straight into `src/web/components/ui/`.

## Commands

```bash
yarn dev              # Start dev server
yarn build            # Typecheck + build
yarn build:mac        # Build + package for macOS (includes re-sign)
yarn lint             # ESLint
yarn format           # Prettier
yarn typecheck        # TypeScript check (node + web)
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

### Design system (shadcn/ui)

`src/web/components/ui/` holds the shadcn primitives. They are vendored source — edit them freely,
but keep the shadcn shape: named exports, `data-slot` attributes, `cva` variant maps, `cn()` for
class merging, and `React.ComponentProps<...>` prop types spread onto the underlying element.

**Primitives** (shadcn API — compose them): `button`, `input`, `textarea`, `label`, `field`,
`input-group`, `badge`, `checkbox`, `switch`, `separator`, `card`, `alert`, `kbd`, `dialog`,
`dropdown-menu`, `select`, `popover`, `hover-card`, `tooltip`, `toggle`, `toggle-group`.

**App composites** (ergonomic wrappers built on those primitives, default exports):
`modal`, `text-field`, `dropdown`, `branch-picker`, `action-menu`, `popover-menu`, `icon-button`,
`icon-toggle`, `segmented-control`, `section-header`, `tree-group-label`, `callout`, `chip`,
`option-card`, `folder-picker`, `color-picker`, `icon-selector`, `agent-card-selector`,
`quick-command-list`, `command-bar`, `tip-box`, `overflow-badge`.

The root `tsconfig.json` carries `paths` purely so `npx shadcn@latest add <component>` can resolve
`@/` — without it the CLI writes into a literal `@/` folder at the repo root.

Rules:

- **Build on shadcn first.** New UI goes through a primitive (`Button`, `Select`, `Dialog`, …) or a
  composite made of primitives. Never hand-roll a button, input, menu, or popover.
- **Add missing primitives with the CLI:** `npx shadcn@latest add tabs`, then restyle it with theme
  tokens (see below) — do not leave shadcn's default `slate` palette classes in place.
- **Overlays are Radix.** Anything portalled (dialog, menu, popover, select, tooltip) must come from
  Radix so focus trapping, collision detection, and dismiss layers are handled for us.
- **Nested overlays inside a `Dialog` must be modal** (`<DropdownMenu modal>`, `<Popover modal>`).
  A non-modal layer is not the top-most dismissable layer, so clicking inside it dismisses the
  dialog underneath. `action-menu` and `branch-picker` already do this.

### Theming

All colors use CSS variables defined in `globals.css`. Never hardcode colors in components.

There are two token layers, one palette:

1. `--nex-*` in `:root` is the source of truth. **A theme only overrides these.**
2. shadcn semantic tokens (`--background`, `--primary`, `--muted`, `--border`, `--input`, `--ring`,
   `--radius`, sidebar tokens…) are aliases over `--nex-*`, re-exported through `@theme inline`.
   Never give them literal colors — that would break theming.

`--radius: 0.5rem` is chosen so `rounded-sm/md/lg/xl` keep Tailwind's default 4/6/8/12px.

**Theme tokens available as Tailwind classes:**

- Backgrounds: `bg-bg`, `bg-bg-soft`, `bg-bg-mute`, `bg-bg-card`, `bg-bg-raised`, `bg-bg-input`, `bg-bg-panel`, `bg-bg-hover`, `bg-bg-item-active`, `bg-bg-menu`
- Borders: `border-border`, `border-border-soft`, `border-border-strong`, `border-border-menu`
- Text: `text-text`, `text-text-secondary`, `text-text-muted`, `text-text-placeholder`
- Accent: `bg-accent`, `bg-accent-hover`
- Destructive: `bg-destructive`, `bg-destructive-hover`, `text-destructive-text`
- Badges: `bg-badge-success-bg`, `text-badge-success-text` (+ warning, error, default)
- Archived: `text-archived` (gray for archived workspace badges)

**NEVER hardcode hex colors in components.** All colors must come from `--nex-*` CSS variables exposed as Tailwind classes. If a needed color doesn't exist as a token, add it to `globals.css` first (both in `@theme` and `:root`), then use the Tailwind class. The only exception is inline `style` for dynamic colors passed as props (e.g. workspace color). This ensures all themes work by overriding variables only.

**Themes.** The active theme is the `data-theme` attribute on `<html>` in `src/web/index.html`.
`globals.css` ships `dark` (the `:root` defaults) and `light` (`[data-theme='light']`). To add another,
copy the light block and override the `--nex-*` variables — no component changes needed.

Two things must be kept in sync when adding a theme:

- The pre-React skeleton in `index.html` repeats `#shell` colors inline (it paints before Tailwind loads).
- `lib/theme.ts` `getTheme()` feeds the theme to third-party renderers that can't read CSS variables
  (sonner, the `@pierre/diffs` viewer). xterm reads `--nex-*` directly and needs nothing.

### Titlebar

The app uses `titleBarStyle: 'hiddenInset'` for native macOS look. The `Titlebar` component provides a 47px drag region with:

- Left: traffic lights zone (78px) + sidebar toggle (PanelLeft icon)
- Center-left: command bar + active badge
- Right: bell, smartphone, grid, settings icons

All interactive elements inside the titlebar must have `WebkitAppRegion: 'no-drag'`.

### Modals

Modals use the `Modal` component (`ui/modal.tsx`), a wrapper over the shadcn `Dialog` (Radix). Key patterns:

- **Always mounted:** Modals stay in the DOM with `open` prop controlling visibility. This enables close animations (fade + scale). Never conditionally render a modal (`{show && <Modal/>}`).
- **`onAfterClose`:** Fires after the close transition ends. Use for deferred actions (e.g. delete after animation).
- **Form reset:** Extract form into a child component with `key` prop to reset state on reopen. E.g. `<MyForm key={entityId ?? 'new'} />` inside the `Modal`. **Never include `open` in the key** — that remounts the form mid-close-animation, so the user sees inputs/dropdowns reset to defaults during the fade-out. Instead, bump a `resetCount` from `onAfterClose` and use it in the key, so the remount happens _after_ the modal is hidden.
- **`ModalPanel`:** Use inside a shared `Dialog` (e.g. onboarding steps) when multiple panels share one overlay. It is centered with `-translate-*` classes, which in Tailwind v4 compile to the standalone CSS `translate` property — an inline `transform` does NOT replace it, it stacks on top and shifts the panel off-center. To animate the panel's position, override the `translate` property inline (e.g. `translate: '-50% -50%'`), never `transform`.
- **`ModalHeader`** renders the Radix `DialogTitle`/`DialogDescription` (falling back to `sr-only` text), which is what keeps the dialog accessible — prefer it over a hand-rolled header.
- **`ModalButton`** is the shadcn `Button`: `default` (accent), `outline` (border), `destructive` (red), plus `ghost`/`secondary`/`link`.
- For anything outside the app's modal chrome, compose the primitives directly (`Dialog`, `DialogContent`, …).

### Action Menu

`ActionMenu` (`ui/action-menu.tsx`) wraps the shadcn `DropdownMenu`. Takes a `trigger` element and an `actions` array; actions with `destructive: true` are auto-separated with a divider. It supports both left-click on the trigger and right-click (on the trigger, or anywhere inside `rowRef`), anchoring the menu to the pointer via a zero-size fixed trigger so Radix keeps collision handling and keyboard navigation.

### Diff viewer

The diff is rendered by `@pierre/diffs` (`CodeView`) in `components/diff/`, with the route in
`routes/diff-view.tsx`.

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

### Sidebar Store

UI state for the sidebar lives in `sidebar.store.ts` (Zustand). This includes collapse state (persisted to settings), and modal open/close flags. Always use individual selectors (`useSidebarStore(s => s.collapsed)`) — never subscribe to the whole store.

### Routing

Uses `MemoryRouter` from react-router-dom. This is required for Electron (no real URL bar). Routes are in `web/routes/`.

## Conventions

- **File names:** `kebab-case` for all files (`terminal-box.tsx`, `use-app-data.ts`)
- **Components:** `PascalCase` exports (`TerminalBox`)
- **Hooks:** `camelCase` with `use` prefix (`useAppData`)
- **Types/Interfaces:** `PascalCase` (`TaskItemProps`)
- **Constants:** `UPPER_SNAKE_CASE` (`IPC`)
- **Formatting:** Prettier with single quotes, semicolons, no trailing commas, 100 char width
- **Linting:** ESLint with TypeScript + React + Prettier integration. `eslint --fix` applies both ESLint and Prettier rules.
- **Interactive elements:** Must have `cursor-pointer` and `select-none`
- **Path aliases:** `@/` → `src/web/`, `@native/` → `src/native/`. Always use aliases instead of relative imports when crossing boundaries (e.g. `@native/db/types` not `../../native/db/types`)
- **Comments:** See the [Comments](#comments) section. The default is none, and the hard limit is 2 lines.
- **Transitions:** No CSS transitions on hover states. All interactions are instant.
- **No hardcoded colors:** NEVER use hardcoded hex colors in components. All colors must use theme tokens from `globals.css`. If a color doesn't exist as a token, create it first. Only exception: inline `style` for dynamic colors passed as props (e.g. workspace color).
- **Native feel:** Global `user-select: none`, `cursor: default`, `-webkit-user-drag: none`. The app should never feel like a website.
- **shadcn by default:** Every piece of UI is built from the shadcn primitives in `ui/`. Reach for `npx shadcn@latest add <component>` before writing a new primitive by hand.
- **No inline markup:** Never leave repeated inline JSX when a component can be extracted. If a pattern appears more than once, create a component. Use existing components (`Button`, `IconButton`, `Badge`, `Dropdown`, `TextField`, etc.) instead of raw `<button>` or `<span>` with manual styling. Any new UI pattern (dropdowns, selectors, toggles, etc.) MUST be built as a reusable component in `ui/` first, then consumed in modals/pages. Never write raw dropdown/select/picker markup inline — always wrap it in a component.
- **Class merging:** Components that accept a `className` must merge it with `cn()` so callers can override, never with template-string concatenation.
- **No shared folders:** Never create `shared/`, `common/`, or similar catch-all directories for types or utilities. Types live where they are defined and get imported where needed (e.g. DB entity types live in `native/db/types.ts`, preload types in `native/preload/index.d.ts`).
- **No generic IPC:** Never expose raw `ipcRenderer.invoke` or a generic `invoke(channel, ...args)` to the renderer. All IPC must go through explicit functions in the preload bridge (`window.api.*`).
- **Migrations are append-only:** Never modify an existing migration in `migrations.ts`. Always add a new entry to the array. Existing DBs may already have run previous migrations.

## Comments

**The default is no comment.** This is not a style preference to be traded off against
"thoroughness" — a comment is a last resort, used only when the code genuinely cannot carry the
information itself. Assume the reader can read TypeScript.

**Hard limit: 2 lines.** Enforced by `nex/max-comment-lines` in `eslint.config.mjs`, which fails the
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
  variant?: 'card' | 'plain';
  /** Control aligned to the right of the label. */
  control?: React.ReactNode;
}

// right
interface Props {
  trailing?: React.ReactNode;
  variant?: 'card' | 'plain';
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

Components are organized by function, not dumped into a flat `ui/` folder:

- **`layout/`** — App structure components (titlebar, sidebar, empty-state, active-badge)
- **`sidebar/`** — Sidebar-specific components (workspace-item, task-group-header, project-label, sidebar-task, count-badge, workspace-badge, task-icon, task-item, project-item)
- **`terminal/`** — Terminal-related components (terminal-box)
- **`ui/`** — shadcn primitives + the app composites built on them (see “Design system” above)
- **`modals/`** — Modal dialogs (workspace-modal, create-project-modal, delete-workspace-modal, manage-workspaces-modal)

When creating a new component, place it in the folder that matches its scope. If it's only used within the sidebar, it goes in `sidebar/`. If it's a generic primitive, it goes in `ui/`. If it's part of the app shell, it goes in `layout/`. Modals go in `modals/`.

## Design Reference

The UI design lives in `pencil-new.pen` (Pencil app). Look for "Worktree Terminal App" frames:

1. **Empty State** — Sidebar + centered CTA with logo and shortcuts
2. **Main View** — Sidebar + horizontal terminal boxes
3. **Grid View** — Sidebar + 2x2 terminal grid
4. **Code Diff** — Sidebar + scrollable diff viewer with file headers
