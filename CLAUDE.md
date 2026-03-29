# Nex

Multi-IDE desktop app for managing git worktrees with integrated terminals, notes, and diff viewer per project.

## Tech Stack

- **Runtime:** Electron 39
- **Frontend:** React 19 + TypeScript 5.9
- **Styling:** Tailwind CSS 4 (via `@tailwindcss/vite`)
- **Build:** electron-vite 5 + Vite 7
- **Package:** electron-builder 26
- **Icons:** lucide-react
- **Routing:** react-router-dom with `MemoryRouter` (not BrowserRouter)
- **Package Manager:** yarn 1.x

## Project Structure

```
src/
├── native/                    # Electron / Node.js (main process)
│   ├── main/
│   │   ├── index.ts           # App lifecycle, menu, IPC, updater
│   │   ├── app-window.ts      # Window creation and management
│   │   ├── menu.ts            # Native app menu
│   │   └── updater.ts         # Auto-updates
│   ├── preload/
│   │   ├── index.ts           # Context bridge
│   │   └── index.d.ts         # Preload types
│   └── ipc/
│       ├── channels.ts        # IPC channel constants (typed)
│       └── handlers.ts        # IPC handlers
│
��── web/                       # React / UI (renderer process)
│   ├── index.html             # Entry HTML
│   ├── main.tsx               # React entry
│   ���── App.tsx                # Root component (Titlebar + Router)
│   ├── routes/                # Pages/views
│   ├── components/            # Reusable components
│   │   ├── titlebar.tsx       # Draggable titlebar (macOS traffic lights)
│   │   └── ui/                # UI primitives
│   ├── hooks/                 # Custom hooks
│   ├── stores/                # State management
│   ├── lib/                   # Utilities
│   ├── styles/
│   │   └── globals.css        # Tailwind + theme variables
│   └── types/
│       └── env.d.ts           # Vite types
│
├── build/                     # Build & packaging config
│   ├── electron-builder.yml   # Electron builder config
│   ├── dev-app-update.yml     # Auto-update config (dev)
│   ├── entitlements.mac.plist # macOS entitlements
│   ├── icon.icns / .ico / .png
│   └── scripts/resign.js     # macOS ad-hoc re-signing (afterSign hook)
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
- Use the `useIPC` hook from `web/hooks/use-ipc.ts` in React components.

### Theming

All colors use CSS variables defined in `globals.css`. Never hardcode colors in components.

**Theme tokens available as Tailwind classes:**
- Backgrounds: `bg-bg`, `bg-bg-soft`, `bg-bg-mute`, `bg-bg-card`
- Borders: `border-border`, `border-border-soft`
- Text: `text-text`, `text-text-secondary`, `text-text-muted`
- Accent: `bg-accent`, `bg-accent-hover`
- Badges: `bg-badge-success-bg`, `text-badge-success-text` (+ warning, error, default)

To add a new theme, create a `[data-theme="name"]` block in `globals.css` overriding the `--nex-*` variables. No component changes needed.

### Titlebar

The app uses `titleBarStyle: 'hiddenInset'` for native macOS look. The `Titlebar` component provides a 38px drag region for window movement. It lives above the router in `App.tsx`.

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

## UI Components (`web/components/ui/`)

| Component | Description |
|---|---|
| `badge` | Status badge with variants: default, success, warning, destructive |
| `icon-button` | Icon-only button using lucide-react icons |
| `section-header` | Collapsible section header with title + action icons |
| `project-item` | Sidebar project entry with color dot |
| `task-item` | Sidebar task entry with branch icon + status badge |
| `terminal-box` | Card with header (title, branch, status, actions) + body |
| `tip-box` | Footer card for tips & shortcuts |
| `shortcut-key` | Keyboard shortcut display (kbd + label) |

## Design Reference

The UI design lives in `pencil-new.pen` (Pencil app). Look for "Worktree Terminal App" frames:
1. **Empty State** — Sidebar + centered CTA with logo and shortcuts
2. **Main View** — Sidebar + horizontal terminal boxes
3. **Grid View** — Sidebar + 2x2 terminal grid
4. **Code Diff** — Sidebar + scrollable diff viewer with file headers
