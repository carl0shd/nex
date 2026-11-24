# Contributing to Nex

Thanks for helping out. Issues and pull requests are welcome; for anything larger than a fix, open an
issue first so we can agree on the approach.

## Development

You need Node 24 (see `.nvmrc`), pnpm 10 and the Xcode command line tools (for the speech helper).

```bash
pnpm install   # also builds native modules and the speech helper
pnpm dev       # runs "Nex Dev" with hot reload
```

| Command          | What it does                                        |
| ---------------- | --------------------------------------------------- |
| `pnpm dev`       | Start the app in development                        |
| `pnpm dev:demo`  | The app with sample tasks and data, for screenshots |
| `pnpm check`     | Format and lint (Oxfmt and Oxlint through Vite+)    |
| `pnpm typecheck` | Type-check main, preload and renderer               |
| `pnpm test`      | Run the unit tests (Vitest)                         |
| `pnpm build:mac` | Build and package the macOS app into `dist/`        |

**Nex Dev** keeps its data in `~/.nex-dev` and its environments apart from the installed app (its own
container names and labels, `.localhost` addresses only), so you can develop Nex while using it.

A pre-commit hook runs the same checks as CI: format, lint, types and tests.

### Project layout

```
src/
├── native/   Electron main process: agents, git, environments, database, IPC
└── web/      React renderer: routes, components, stores and pure logic in lib/
```

## Pull requests

- Read [`CLAUDE.md`](CLAUDE.md) first: it holds the conventions the codebase follows, from theming
  tokens and motion to how comments are written.
- Every change a user would notice ships with a changeset: one sentence in `.changeset/<slug>.md`.
- Keep pull requests focused, and make sure `pnpm check`, `pnpm typecheck` and `pnpm test` pass.

## Releases

Nex uses [Changesets](https://github.com/changesets/changesets). Every push to `main` updates a
"chore: version packages" pull request with the next version and its changelog. Merging it tags the
release, publishes the GitHub Release and attaches the macOS app. See [`CHANGELOG.md`](CHANGELOG.md).
