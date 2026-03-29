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
- **Package Manager:** yarn 1.x

## Project Structure

```
src/
├── native/                    # Electron / Node.js (main process)
│   ├── main/
│   │   ├── index.ts           # App lifecycle, menu, IPC, updater
│   │   ├── app-window.ts      # Window creation and management
│   │   ├── store.ts           # Persistent key-value store (JSON files in userData)
│   │   ├── menu.ts            # Native app menu
│   │   └── updater.ts         # Auto-updates
│   ├── preload/
│   │   ├── index.ts           # Context bridge
│   │   └── index.d.ts         # Preload types
│   └── ipc/
│       ├── channels.ts        # IPC channel constants (typed)
│       └── handlers.ts        # IPC handlers
│
├── web/                       # React / UI (renderer process)
│   ├── index.html             # Entry HTML (shell skeleton for instant load)
│   ├── main.tsx               # React entry (react-scan in dev)
│   ├── App.tsx                # Root component (ErrorBoundary + Titlebar + Sidebar + Router)
│   ├── routes/                # Pages/views
│   │   └── home.tsx           # Main view (renders EmptyState or workspace content)
│   ├── components/
│   │   ├── layout/            # App structure (titlebar, sidebar, empty-state, active-badge)
│   │   ├── sidebar/           # Sidebar-specific (workspace-item, task-group-header, etc.)
│   │   ├── terminal/          # Terminal-related (terminal-box)
│   │   ├── ui/                # Generic primitives (badge, icon-button, shortcut-key, etc.)
│   │   └── error-boundary.tsx # React error boundary
│   ├── hooks/                 # Custom hooks
│   │   ├── use-ipc.ts         # IPC invoke/send functions
│   │   ├── use-fullscreen.ts  # Detect fullscreen state
│   │   └── use-scrollable.ts  # Detect SimpleBar scroll visibility
│   ├── stores/                # State management
│   ├── lib/                   # Utilities
│   │   └── status.ts          # Shared status types and mappings
│   ├── assets/                # Images, SVGs
│   │   └── logo-white.svg     # Nex logo
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
- Communication via IPC. Channels defined in `native/ipc/channels.ts`, handlers in `native/ipc/handlers.ts`.
- Use the `invoke` and `send` functions from `web/hooks/use-ipc.ts` in React components.

### Window

- Transparent window (`transparent: true`) to remove macOS native border
- `titleBarStyle: 'hiddenInset'` with custom `trafficLightPosition`
- Window state (position, size, maximized) persisted via `native/main/store.ts`
- Shell skeleton in `index.html` renders before React for instant visual load
- `user-select: none`, `cursor: default`, `-webkit-user-drag: none` on body for native feel

### Theming

All colors use CSS variables defined in `globals.css`. Never hardcode colors in components.

**Theme tokens available as Tailwind classes:**
- Backgrounds: `bg-bg`, `bg-bg-soft`, `bg-bg-mute`, `bg-bg-card`
- Borders: `border-border`, `border-border-soft`
- Text: `text-text`, `text-text-secondary`, `text-text-muted`, `text-text-placeholder`
- Accent: `bg-accent`, `bg-accent-hover`
- Badges: `bg-badge-success-bg`, `text-badge-success-text` (+ warning, error, default)

To add a new theme, create a `[data-theme="name"]` block in `globals.css` overriding the `--nex-*` variables. No component changes needed.

### Scrollbar

Uses `simplebar-react` for custom scrollbars. Styles in `globals.css`. Use `useSimplebarVisible` hook to detect when scrollbar is active (adds padding to avoid content overlap).

### Titlebar

The app uses `titleBarStyle: 'hiddenInset'` for native macOS look. The `Titlebar` component provides a 47px drag region with:
- Left: traffic lights zone (78px) + sidebar toggle (PanelLeft icon)
- Center-left: command bar + active badge
- Right: bell, smartphone, grid, settings icons

All interactive elements inside the titlebar must have `WebkitAppRegion: 'no-drag'`.

### Routing

Uses `MemoryRouter` from react-router-dom. This is required for Electron (no real URL bar). Routes are in `web/routes/`.

## Conventions

- **File names:** `kebab-case` for all files (`terminal-box.tsx`, `use-ipc.ts`)
- **Components:** `PascalCase` exports (`TerminalBox`)
- **Hooks:** `camelCase` with `use` prefix (`useIpc`)
- **Types/Interfaces:** `PascalCase` (`TaskItemProps`)
- **Constants:** `UPPER_SNAKE_CASE` (`IPC`)
- **Formatting:** Prettier with single quotes, semicolons, no trailing commas, 100 char width
- **Linting:** ESLint with TypeScript + React + Prettier integration. `eslint --fix` applies both ESLint and Prettier rules.
- **Interactive elements:** Must have `cursor-pointer` and `select-none`
- **Path aliases:** `@/` → `src/web/` (use `@/components/ui/badge` not `./badge`)
- **Comments:** Only add comments for non-obvious business logic or workarounds. Never comment what the code does (e.g. `// Divider`, `// Footer`). Well-named components and variables are self-documenting.
- **Transitions:** No CSS transitions on hover states. All interactions are instant.
- **Hardcoded colors:** Never use hardcoded hex colors in components. Always use theme tokens. Exception: inline `style` for dynamic colors passed as props (e.g. workspace color).
- **Native feel:** Global `user-select: none`, `cursor: default`, `-webkit-user-drag: none`. The app should never feel like a website.

## Components

Components are organized by function, not dumped into a flat `ui/` folder:

- **`layout/`** — App structure components (titlebar, sidebar, empty-state, active-badge)
- **`sidebar/`** — Sidebar-specific components (workspace-item, task-group-header, project-label, sidebar-task, count-badge, workspace-badge, task-icon, task-item, project-item)
- **`terminal/`** — Terminal-related components (terminal-box)
- **`ui/`** — Generic reusable primitives (badge, icon-button, section-header, shortcut-key, tip-box, command-bar)

When creating a new component, place it in the folder that matches its scope. If it's only used within the sidebar, it goes in `sidebar/`. If it's a generic primitive, it goes in `ui/`. If it's part of the app shell, it goes in `layout/`.

## Design Reference

The UI design lives in `pencil-new.pen` (Pencil app). Look for "Worktree Terminal App" frames:
1. **Empty State** — Sidebar + centered CTA with logo and shortcuts
2. **Main View** — Sidebar + horizontal terminal boxes
3. **Grid View** — Sidebar + 2x2 terminal grid
4. **Code Diff** — Sidebar + scrollable diff viewer with file headers
