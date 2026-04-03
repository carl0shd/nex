import { randomUUID } from 'crypto';
import { getDb } from '@native/db/database';

export function seedDevData(): void {
  const db = getDb();

  const hasData = db.prepare('SELECT COUNT(*) as count FROM workspaces').get() as {
    count: number;
  };
  if (hasData.count > 0) return;

  const [wsTrabajo, wsPersonal, wsAcme, wsFreelance] = Array.from({ length: 4 }, () =>
    randomUUID()
  );
  const [pjApi, pjFrontend, pjAuth, pjBlog, pjMobile, pjAcmeDash] = Array.from({ length: 6 }, () =>
    randomUUID()
  );
  const [wt1, wt2, wt3, wt4, wt5] = Array.from({ length: 5 }, () => randomUUID());

  db.transaction(() => {
    const insertWs = db.prepare(
      'INSERT INTO workspaces (id, name, color, sort_order) VALUES (?, ?, ?, ?)'
    );
    insertWs.run(wsTrabajo, 'trabajo', '#3B82F6', 0);
    insertWs.run(wsPersonal, 'personal', '#8B5CF6', 1);
    insertWs.run(wsAcme, 'acme-corp', '#F59E0B', 2);
    insertWs.run(wsFreelance, 'freelance', '#636363', 3);

    const insertPj = db.prepare(
      'INSERT INTO projects (id, workspace_id, name, path, sort_order) VALUES (?, ?, ?, ?, ?)'
    );
    insertPj.run(pjApi, wsTrabajo, 'api-gateway', '/code/api-gateway', 0);
    insertPj.run(pjFrontend, wsTrabajo, 'frontend-app', '/code/frontend-app', 1);
    insertPj.run(pjAuth, wsTrabajo, 'auth-service', '/code/auth-service', 2);
    insertPj.run(pjBlog, wsPersonal, 'blog-site', '/personal/blog-site', 0);
    insertPj.run(pjMobile, wsPersonal, 'mobile-app', '/personal/mobile-app', 1);
    insertPj.run(pjAcmeDash, wsAcme, 'dashboard', '/acme/dashboard', 0);

    const insertWt = db.prepare(
      'INSERT INTO worktrees (id, project_id, branch, path, dot_color, active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    insertWt.run(wt1, pjApi, 'feat-auth', '/code/api-gateway/wt/feat-auth', '#175F52', 1, 0);
    insertWt.run(wt2, pjApi, 'fix-cors', '/code/api-gateway/wt/fix-cors', '#636363', 1, 1);
    insertWt.run(wt3, pjApi, 'refactor-db', '/code/api-gateway/wt/refactor-db', '#636363', 1, 2);
    insertWt.run(wt4, pjFrontend, 'fix-nav', '/code/frontend-app/wt/fix-nav', '#F59E0B', 1, 0);
    insertWt.run(wt5, pjBlog, 'redesign', '/personal/blog-site/wt/redesign', '#636363', 1, 0);

    const insertTask = db.prepare(
      'INSERT INTO tasks (id, project_id, worktree_id, name, status) VALUES (?, ?, ?, ?, ?)'
    );
    insertTask.run(randomUUID(), pjApi, wt1, 'implement jwt refresh', 'running');
    insertTask.run(randomUUID(), pjApi, wt2, 'fix cors headers', 'idle');
    insertTask.run(randomUUID(), pjApi, wt3, 'migrate to drizzle', 'idle');
    insertTask.run(randomUUID(), pjFrontend, wt4, 'fix mobile nav', 'running');
    insertTask.run(randomUUID(), pjBlog, wt5, 'new landing page', 'idle');
  })();
}
