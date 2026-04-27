import { mkdir, writeFile, symlink } from 'fs/promises';
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
  setupGitExclude,
  isGitRepo
} from '@native/git/git';
import { setupSymlinks } from '@native/git/symlinks';
import type { Session, StartWorkInput } from '@native/db/types';

async function writeIfMissing(path: string, content: string): Promise<void> {
  try {
    await writeFile(path, content, { flag: 'wx' });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'EEXIST') throw err;
  }
}

async function linkIfMissing(target: string, link: string): Promise<void> {
  try {
    await symlink(target, link);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'EEXIST') throw err;
  }
}

export async function startWork(input: StartWorkInput): Promise<Session> {
  const project = projectRepo.getById(input.projectId);
  if (!project) throw new Error(`Project not found: ${input.projectId}`);

  const existing = sessionRepo.getByName(input.name, project.id);
  if (existing && existing.status === 'active') {
    throw new Error(`Active session '${input.name}' already exists for this project`);
  }

  const sessionsDir = join(homedir(), '.nex', 'sessions', project.name, input.name);
  await mkdir(sessionsDir, { recursive: true });

  const notesPath = join(sessionsDir, 'TASK_NOTES.md');
  await writeIfMissing(notesPath, `# ${input.name}\n\n## Notes\n`);

  const sharedPath = join(homedir(), '.nex', 'sessions', project.name, 'SHARED_CONTEXT.md');
  await writeIfMissing(sharedPath, `# ${project.name} - Shared Context\n`);

  if (!(await isGitRepo(project.path))) {
    return sessionRepo.create({
      projectId: project.id,
      agentId: input.agentId,
      accountId: input.accountId,
      name: input.name,
      branch: '',
      baseBranch: '',
      worktreePath: project.path,
      notesPath,
      symlinks: []
    });
  }

  const [detected] = await Promise.all([detectBaseBranch(project.path), fetchOrigin(project.path)]);
  const baseBranch = input.baseBranch?.trim() || detected;
  const prefix = (project.branchPrefix || '').replace(/\/+$/, '');
  const branch = prefix ? `${prefix}/${input.name}` : input.name;
  const wtPath = join(project.path, '.worktrees', input.name);
  await createWorktree(project.path, branch, wtPath, baseBranch);

  try {
    setupGitExclude(project.path);
    setupSymlinks(project.path, wtPath, ['.claude']);

    await linkIfMissing(notesPath, join(wtPath, 'TASK_NOTES.md'));
    await linkIfMissing(sharedPath, join(wtPath, 'SHARED_CONTEXT.md'));

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
