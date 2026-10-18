# Nex

macOS desktop app for running Claude Code on many git worktrees at once, with terminals, notes, a diff viewer and a built-in browser per task.

## Tech Stack

- **Runtime:** Electron 44, macOS only (the builder config has no Windows or Linux targets)
- **Frontend:** React 19 + TypeScript 6
- **Styling:** Tailwind CSS 4 (via `@tailwindcss/vite`)
- **Build:** electron-vite 6 + Vite 8 (the Vite+ core)
- **Toolchain:** Vite+ (`vp`, pinned through the pnpm catalog) — Vitest, Oxlint and Oxfmt behind one CLI, configured in `vite.config.ts`; electron-vite still builds main, preload and renderer from `electron.vite.config.ts`
- **Package:** electron-builder 26
- **Icons:** lucide-react
- **Scrollbar:** simplebar-react
- **Routing:** react-router 8 data router via `createMemoryRouter` (no real URLs in Electron)
- **State:** Zustand (hook-based stores in `web/stores/`)
- **Design system:** shadcn/ui (new-york) on Radix UI + `class-variance-authority` + `clsx` + `tailwind-merge`
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
│   │   ├── design-system/     # Specimens rendered by routes/design-system.tsx
│   │   ├── ui/                # shadcn primitives + app composites
│   │   └── error-boundary.tsx # React error boundary
│   ├── hooks/
│   │   └── use-system-theme.ts
│   ├── stores/                # Zustand stores
│   │   └── settings.store.ts  # Theme preference
│   ├── lib/
│   │   ├── utils.ts           # `cn()` — clsx + tailwind-merge (used by every ui/ component)
│   │   └── theme.ts           # applyTheme / getTheme
│   ├── assets/                # Images, SVGs
│   │   └── logo.svg     # Nex logo
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

`components.json` at the repo root is the shadcn CLI config (aliases point at `src/web`), so
`npx shadcn@latest add <component>` drops new primitives straight into `src/web/components/ui/`.

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

### Design system (shadcn/ui)

`src/web/components/ui/` holds the shadcn primitives. They are vendored source — edit them freely,
but keep the shadcn shape: named exports, `data-slot` attributes, `cva` variant maps, `cn()` for
class merging, and `React.ComponentProps<...>` prop types spread onto the underlying element.

**Primitives** (shadcn API — compose them): `button`, `input`, `textarea`, `label`, `field`,
`input-group`, `badge`, `checkbox`, `switch`, `separator`, `card`, `alert`, `kbd`, `dialog`,
`dropdown-menu`, `select`, `popover`, `hover-card`, `tooltip`, `toggle`, `toggle-group`,
`status-pill`, `shimmer`, `spinner`, `glide-highlight`, `selectable` (cva for selectable cards).

**App composites** (ergonomic wrappers built on those primitives, default exports):
`modal`, `text-field`, `dropdown`, `branch-picker`, `action-menu`, `popover-menu`, `icon-button`,
`icon-toggle`, `segmented-control`, `section-header`, `tree-group-label`, `callout`, `chip`,
`option-card`, `folder-picker`, `color-picker`, `icon-selector`, `agent-card-selector`,
`quick-command-list`, `command-bar`, `tip-box`, `overflow-badge`.

The root `tsconfig.json` carries `paths` purely so `npx shadcn@latest add <component>` can resolve
`@/` — without it the CLI writes into a literal `@/` folder at the repo root.

**Living style guide:** `routes/design-system.tsx` (dev only — palette icon in the titlebar) renders
every token and `ui/` component from `components/design-system/`. Add a specimen when you add or
change a component.

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
The visual language is **beautiful-ui** (structure, rings, motion) plus its own palette
(warm neutrals, green brand) and a subtle glass for floating chrome.

**No gradients or colored backgrounds.** No aurora/blob washes, glows, or gradient-filled buttons and
tiles — surfaces are flat tokens, depth comes from surface steps, rings and shadows only.

There are two layers, one palette:

1. The palette in `:root` (dark) and `[data-theme='light']` is the source of truth. **A theme only
   overrides these variables.**
2. `@theme inline` turns them into utilities and aliases the shadcn semantic tokens (`--background`,
   `--primary`, `--muted`, `--border`, `--ring`, sidebar tokens…) onto them. Never give the shadcn
   tokens literal colors.

**Tokens as Tailwind classes:**

- Surfaces (solid, one step per layer): `bg-page`, `bg-canvas`, `bg-surface`, `bg-surface-raised`,
  `bg-inset`, `bg-terminal`, `bg-muted`, `bg-muted-strong`
- Interaction fills (translucent, so they read on glass): `bg-field`, `bg-hover`, `bg-hover-2`, `bg-active`
- Ink: `text-ink`, `text-ink-2`, `text-ink-3`, `text-ink-4`, `text-inverse`, `text-on-color`
- Lines (translucent): `line-soft`, `line`, `line-strong`, `line-hover` (as `border-*`, `bg-*`, `ring-*`)
- Brand: `primary`, `primary-hover`, `primary-deep`, `primary-ink` (text on tint), `primary-tint`,
  `primary-foreground`, `ring`
- Semantic: `green`, `orange`, `red`, `blue`, `yellow` — tint with opacity (`bg-red/14`), never new tokens
- Data: `chart-cost`, `chart-1..5`, `chart-grid`

**Shape.** Radii: `rounded-chip` 6 · `rounded-control` 8 · `rounded-card` 10 · `rounded-panel` 14 ·
`rounded-window` 18 · `rounded-full` (buttons, badges, pills). Outlines are rings, not borders:
`shadow-hairline` → `shadow-btn` → `shadow-card` → `shadow-raised` → `shadow-overlay`, plus
`shadow-solid` (filled controls) and `shadow-glass`.

**Type.** Dense scale: `text-3xs` 10 · `2xs` 11 · `xs` 12 · `sm` 13 · `base` 14 · `lg` 16 · `xl` 20 ·
`2xl` 24 · `3xl` 30. Never use arbitrary `text-[Npx]`. `eyebrow` is the section label (sentence case).
**Never use uppercase text** anywhere in the app — no `uppercase`, no all-caps copy, no wide tracking on
labels. Section labels are sentence case ("Workspaces", not "WORKSPACES").

**Glass.** Kept deliberately subtle: frosted, never a light source. `glass` (mostly-opaque tint +
28px blur + inner ring, no sheen) is for floating chrome:
titlebar islands, floating panels, docks. `glass-panel` is the frosted, mostly-opaque version for large
surfaces. Menus, popovers, dialogs and anything with dense text stay solid (`bg-surface-raised`).
Terminals and code stay solid too. Tune intensity through the palette variables (`--glass-tint`,
`--glass-filter`), never per component.

**NEVER hardcode hex colors in components.** If a color doesn't exist, add it to the palette (both
themes) and to `@theme inline`, then use the class. The only exception is inline `style` for dynamic
colors passed as props (e.g. workspace color).

**Themes.** The active theme is the `data-theme` attribute on `<html>`. `applyTheme` adds
`.theme-switching` for one frame so hover transitions don't fade every token at a different speed.
To add a theme, copy the light block and override the palette — no component changes needed.

Keep in sync when changing the palette:

- The pre-React skeleton in `index.html` repeats `#shell` colors inline (it paints before Tailwind loads).
- `lib/theme.ts` `getTheme()` feeds third-party renderers (sonner, `@pierre/diffs`). xterm reads
  `--terminal`, `--ink` and `--terminal-selection` directly — keep those as hex/rgba.

### Motion

Motion is CSS only. Use `interactive` (150ms, `ease-out-strong`) on anything with a hover or state
change, and `press` (scale 0.97 on `:active`) on clickables. Overlays enter with tw-animate
(`animate-in fade-in-0 zoom-in-95 duration-150 ease-out-strong`). Menus and lists use
`GlideHighlight` — one hover layer that slides between rows — instead of per-row hover fills.
`SegmentedControl` slides its thumb. Long-running agent states use `Shimmer`. Everything respects
`prefers-reduced-motion` globally.

### Titlebar

The app uses `titleBarStyle: 'hiddenInset'` for native macOS look. `layout/titlebar.tsx` is a 47px
drag region; its contents are being rebuilt from the wireframes (see Design Reference).

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

The diff is rendered by `@pierre/diffs` (`CodeView`). The renderer was removed for the rebuild; the
previous version lives on the `backup/redesign-v1` branch and these rules still apply to the new one.

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
- **Interactive elements:** Must have `cursor-pointer` and `select-none`
- **Path aliases:** `@/` → `src/web/`, `@native/` → `src/native/`. Always use aliases instead of relative imports when crossing boundaries (e.g. `@native/db/types` not `../../native/db/types`)
- **Comments:** See the [Comments](#comments) section. The default is none, and the hard limit is 2 lines.
- **Transitions:** Short and strong: `interactive` (150ms `ease-out-strong`) and `press`. No slow fades, no `ease-in` on UI.
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

Components are organized by function, not dumped into a flat `ui/` folder:

- **`layout/`** — App structure components (titlebar, sidebar)
- **`sidebar/`** — Sidebar-specific components

### Sidebar

Ported from beautiful-ui's `SidebarNav`: **one persistent 260px tree** clipped to a 52px rail when
collapsed — never a second "collapsed" component. Every row is a `.sidebar-row` (244px → 36px) whose
glyph sits in a `size-5` slot so it stays at x=26 in both states; text goes in `.sidebar-copy`, which
fades and slides out. Nested lists use `CollapsibleRows`, which the rail closes automatically unless
it is `railVisible` (the workspace badges). The CSS lives in the `Sidebar` block of `globals.css`.

- **`ui/`** — shadcn primitives + the app composites built on them (see “Design system” above)
- **`modals/`** — Modal dialogs

When creating a new component, place it in the folder that matches its scope. If it's only used within the sidebar, it goes in `sidebar/`. If it's a generic primitive, it goes in `ui/`. If it's part of the app shell, it goes in `layout/`. Modals go in `modals/`.

## Design Reference

The UI design lives in the "Nex 2 — Wireframes" canvas: https://claude.ai/artifact/GbdEmDmeVR2CGVQmXxiqMi
(home strip, task view with session strip + side panel, changes, built-in browser, first run,
settings, usage, task environments, composer states).
