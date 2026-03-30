import EmptyState from '@/components/layout/empty-state';
import WorktreeView from '@/components/layout/worktree-view';
import type { Worktree } from '@/lib/worktree';

const MOCK_WORKTREES: Worktree[] = [
  {
    id: '1',
    branch: 'feat-auth',
    workspace: 'trabajo',
    project: 'api-gateway',
    dotColor: '#175F52',
    active: true,
    notes: '- implement jwt refresh flow\n- add rate limiting middleware',
    inputPlaceholder: '> type a message...',
    files: [
      { name: 'src/auth/handler.ts', added: 42, removed: 8, status: 'modified' },
      { name: 'src/auth/middleware.ts', added: 156, removed: 0, status: 'added' },
      { name: 'src/routes/index.ts', added: 12, removed: 3, status: 'modified' },
      { name: 'src/auth/legacy.ts', added: 0, removed: 89, status: 'deleted' },
      { name: 'src/config/env.ts', added: 5, removed: 2, status: 'modified' }
    ],
    totalFiles: 300,
    totalAdded: 8993,
    totalRemoved: 14507,
    tabs: [
      { name: 'Claude Code', dotColor: '#14957D', active: true },
      { name: 'Terminal 2', dotColor: '#F97316' },
      { name: 'Terminal 3', dotColor: '#F97316' },
      { name: 'Terminal 2', dotColor: '#F97316' }
    ],
    commands: [{ label: 'yarn dev' }, { label: 'yarn build' }],
    commandOverflowCount: 1
  },
  {
    id: '2',
    branch: 'fix-nav',
    workspace: 'trabajo',
    project: 'frontend-app',
    dotColor: '#F59E0B',
    active: false,
    notes: '- fix mobile hamburger menu\n- active state not highlighting',
    inputPlaceholder: '> fix the mobile nav breakpoint',
    files: [
      { name: 'src/components/Nav.tsx', added: 33, removed: 12, status: 'modified' },
      { name: 'src/hooks/useNav.ts', added: 12, removed: 0, status: 'added' }
    ],
    totalFiles: 2,
    totalAdded: 45,
    totalRemoved: 12,
    tabs: [
      { name: 'Claude Code', dotColor: '#14957D', active: true },
      { name: 'Terminal 2', dotColor: '#F97316' }
    ],
    commands: [{ label: 'yarn dev' }, { label: 'yarn lint' }],
    commandOverflowCount: 1
  }
];

function Home(): React.JSX.Element {
  const hasWorktrees = MOCK_WORKTREES.length > 0;

  if (!hasWorktrees) return <EmptyState />;

  return <WorktreeView worktrees={MOCK_WORKTREES} />;
}

export default Home;
