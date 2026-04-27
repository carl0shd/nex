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
- **UI primitives:** @headlessui/react (Dialog, Menu, Listbox — for modals, context menus, dropdowns)
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

### Theming

All colors use CSS variables defined in `globals.css`. Never hardcode colors in components.

**Theme tokens available as Tailwind classes:**

- Backgrounds: `bg-bg`, `bg-bg-soft`, `bg-bg-mute`, `bg-bg-card`, `bg-bg-raised`, `bg-bg-input`, `bg-bg-panel`, `bg-bg-hover`, `bg-bg-item-active`, `bg-bg-menu`
- Borders: `border-border`, `border-border-soft`, `border-border-strong`, `border-border-menu`
- Text: `text-text`, `text-text-secondary`, `text-text-muted`, `text-text-placeholder`
- Accent: `bg-accent`, `bg-accent-hover`
- Destructive: `bg-destructive`, `bg-destructive-hover`, `text-destructive-text`
- Badges: `bg-badge-success-bg`, `text-badge-success-text` (+ warning, error, default)
- Archived: `text-archived` (gray for archived workspace badges)

**NEVER hardcode hex colors in components.** All colors must come from `--nex-*` CSS variables exposed as Tailwind classes. If a needed color doesn't exist as a token, add it to `globals.css` first (both in `@theme` and `:root`), then use the Tailwind class. The only exception is inline `style` for dynamic colors passed as props (e.g. workspace color). This ensures all themes work by overriding variables only.

To add a new theme, create a `[data-theme="name"]` block in `globals.css` overriding the `--nex-*` variables. No component changes needed.

### Scrollbar

Uses `simplebar-react` for custom scrollbars. Styles in `globals.css`. Use `useSimplebarVisible` hook to detect when scrollbar is active (adds padding to avoid content overlap).

### Titlebar

The app uses `titleBarStyle: 'hiddenInset'` for native macOS look. The `Titlebar` component provides a 47px drag region with:

- Left: traffic lights zone (78px) + sidebar toggle (PanelLeft icon)
- Center-left: command bar + active badge
- Right: bell, smartphone, grid, settings icons

All interactive elements inside the titlebar must have `WebkitAppRegion: 'no-drag'`.

### Modals

Modals use Headless UI `Dialog` via the `Modal` component (`ui/modal.tsx`). Key patterns:

- **Always mounted:** Modals stay in the DOM with `open` prop controlling visibility. This enables close animations (fade + scale). Never conditionally render a modal (`{show && <Modal/>}`).
- **`onAfterClose`:** Fires after the close transition ends. Use for deferred actions (e.g. delete after animation).
- **Form reset:** Extract form into a child component with `key` prop to reset state on reopen. E.g. `<MyForm key={entityId ?? 'new'} />` inside the `Modal`. **Never include `open` in the key** — that remounts the form mid-close-animation, so the user sees inputs/dropdowns reset to defaults during the fade-out. Instead, bump a `resetCount` from `onAfterClose` and use it in the key, so the remount happens *after* the modal is hidden.
- **`ModalPanel`:** Use inside a shared `Dialog` (e.g. onboarding steps) when multiple panels share one backdrop.
- **`ModalButton` variants:** `primary` (accent), `ghost` (border), `destructive` (red).

### Context Menu

`ContextMenu` (`ui/context-menu.tsx`) uses Headless UI `Menu` with portal rendering. Takes a `trigger` element and `actions` array. Actions with `destructive: true` are auto-separated with a divider.

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
- **Comments:** Only add comments for non-obvious business logic or workarounds. Never comment what the code does (e.g. `// Divider`, `// Footer`). Well-named components and variables are self-documenting.
- **Transitions:** No CSS transitions on hover states. All interactions are instant.
- **No hardcoded colors:** NEVER use hardcoded hex colors in components. All colors must use theme tokens from `globals.css`. If a color doesn't exist as a token, create it first. Only exception: inline `style` for dynamic colors passed as props (e.g. workspace color).
- **Native feel:** Global `user-select: none`, `cursor: default`, `-webkit-user-drag: none`. The app should never feel like a website.
- **No inline markup:** Never leave repeated inline JSX when a component can be extracted. If a pattern appears more than once, create a component. Use existing components (`IconButton`, `Badge`, `Dropdown`, `Input`, etc.) instead of raw `<button>` or `<span>` with manual styling. Any new UI pattern (dropdowns, selectors, toggles, etc.) MUST be built as a reusable component in `ui/` first, then consumed in modals/pages. Never write raw dropdown/select/picker markup inline — always wrap it in a component.
- **No shared folders:** Never create `shared/`, `common/`, or similar catch-all directories for types or utilities. Types live where they are defined and get imported where needed (e.g. DB entity types live in `native/db/types.ts`, preload types in `native/preload/index.d.ts`).
- **No generic IPC:** Never expose raw `ipcRenderer.invoke` or a generic `invoke(channel, ...args)` to the renderer. All IPC must go through explicit functions in the preload bridge (`window.api.*`).
- **Migrations are append-only:** Never modify an existing migration in `migrations.ts`. Always add a new entry to the array. Existing DBs may already have run previous migrations.

## Components

Components are organized by function, not dumped into a flat `ui/` folder:

- **`layout/`** — App structure components (titlebar, sidebar, empty-state, active-badge)
- **`sidebar/`** — Sidebar-specific components (workspace-item, task-group-header, project-label, sidebar-task, count-badge, workspace-badge, task-icon, task-item, project-item)
- **`terminal/`** — Terminal-related components (terminal-box)
- **`ui/`** — Generic reusable primitives (modal, context-menu, dropdown, icon-button, input, color-picker, icon-selector, badge, section-header, shortcut-key, tip-box, command-bar, folder-picker)
- **`modals/`** — Modal dialogs (workspace-modal, create-project-modal, delete-workspace-modal, manage-workspaces-modal)

When creating a new component, place it in the folder that matches its scope. If it's only used within the sidebar, it goes in `sidebar/`. If it's a generic primitive, it goes in `ui/`. If it's part of the app shell, it goes in `layout/`. Modals go in `modals/`.

## Design Reference

The UI design lives in `pencil-new.pen` (Pencil app). Look for "Worktree Terminal App" frames:

1. **Empty State** — Sidebar + centered CTA with logo and shortcuts
2. **Main View** — Sidebar + horizontal terminal boxes
3. **Grid View** — Sidebar + 2x2 terminal grid
4. **Code Diff** — Sidebar + scrollable diff viewer with file headers
