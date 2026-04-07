import { existsSync, mkdirSync, writeFileSync, symlinkSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import * as projectRepo from '@native/db/repositories/project.repo';
import * as sessionRepo from '@native/db/repositories/session.repo';
import {
  detectBaseBranch,
  fetchOrigin,
  createWorktree,
  removeWorktree,
  deleteBranch,
  setupGitExclude
} from '@native/git/git';
import { setupSymlinks } from '@native/git/symlinks';
import type { Session, StartWorkInput } from '@native/db/types';

export async function startWork(input: StartWorkInput): Promise<Session> {
  const project = projectRepo.getById(input.projectId);
  if (!project) throw new Error(`Project not found: ${input.projectId}`);

  const existing = sessionRepo.getByName(input.name, project.id);
  if (existing && existing.status === 'active') {
    throw new Error(`Active session '${input.name}' already exists for this project`);
  }

  const [baseBranch] = await Promise.all([
    detectBaseBranch(project.path),
    fetchOrigin(project.path)
  ]);
  const prefix = project.branchPrefix || '';
  const branch = prefix ? `${prefix}/${input.name}` : input.name;
  const wtPath = join(project.path, '.worktrees', input.name);
  await createWorktree(project.path, branch, wtPath, baseBranch);

  try {
    setupGitExclude(project.path);
    setupSymlinks(project.path, wtPath, ['.claude']);

    const sessionsDir = join(homedir(), '.nex', 'sessions', project.name, input.name);
    mkdirSync(sessionsDir, { recursive: true });

    const notesPath = join(sessionsDir, 'TASK_NOTES.md');
    if (!existsSync(notesPath)) {
      writeFileSync(notesPath, `# ${input.name}\n\n## Notes\n`);
    }
    const notesLink = join(wtPath, 'TASK_NOTES.md');
    if (!existsSync(notesLink)) symlinkSync(notesPath, notesLink);

    const sharedDir = join(homedir(), '.nex', 'sessions', project.name);
    const sharedPath = join(sharedDir, 'SHARED_CONTEXT.md');
    if (!existsSync(sharedPath)) {
      writeFileSync(sharedPath, `# ${project.name} - Shared Context\n`);
    }
    const sharedLink = join(wtPath, 'SHARED_CONTEXT.md');
    if (!existsSync(sharedLink)) symlinkSync(sharedPath, sharedLink);

    return sessionRepo.create({
      projectId: project.id,
      agentId: input.agentId,
      accountId: input.accountId,
      name: input.name,
      branch,
      baseBranch,
      worktreePath: wtPath,
      notesPath,
      symlinks: ['.claude']
    });
  } catch (err) {
    await removeWorktree(project.path, wtPath).catch(() => {});
    await deleteBranch(project.path, branch).catch(() => {});
    throw err;
  }
}
