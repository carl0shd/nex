import { existsSync } from "fs";
import { cp, mkdir, writeFile, symlink } from "fs/promises";
import { join } from "path";
import * as projectRepo from "@native/db/repositories/project.repo";
import * as sessionRepo from "@native/db/repositories/session.repo";
import { getNexDir } from "@native/paths";
import {
  detectBaseBranch,
  fetchOrigin,
  createWorktree,
  initSubmodules,
  removeWorktree,
  deleteBranch,
  setupGitExclude,
  isGitRepo,
  refExists,
} from "@native/git/git";
import { copyEnvFiles } from "@native/git/env-files";
import { setupSymlinks } from "@native/git/symlinks";
import { createTerminalForSession } from "@native/agents/agent-terminal";
import type { ProjectSetup, Session, StartWorkInput } from "@native/db/types";
import { spawnTerminal } from "@native/pty/manager";
import { sendToAgent } from "@native/agents/agent-runner";
import { adoptClaudeSession } from "@native/agents/claude-sessions";
import { saveAgentSettings } from "@native/agents/agent-settings";
import { startTaskEnvironmentOnCreate } from "@native/environments/task-env";

function createPrimaryTerminal(
  session: Session,
  prompt?: string,
  resume?: StartWorkInput["resumeClaudeSession"],
): void {
  const terminal = createTerminalForSession({
    sessionId: session.id,
    type: session.agentId ? "agent" : "shell",
    isPrimary: true,
  });
  if (terminal.type === "agent" && resume) adoptClaudeSession(terminal.id, resume);
  if (terminal.type === "agent" && prompt?.trim()) sendToAgent(session.id, prompt.trim());
}

async function copySetupFiles(from: string, to: string, setup: ProjectSetup): Promise<void> {
  if (!setup.copy.on) return;
  for (const file of setup.copy.files) {
    const source = join(from, file);
    if (!existsSync(source)) continue;
    await cp(source, join(to, file), { recursive: true, force: false, errorOnExist: false });
  }
}

function setupCommand(setup: ProjectSetup): string {
  const steps = [
    setup.install.on ? setup.install.command.trim() : "",
    setup.script.on && setup.script.path.trim()
      ? `sh ${JSON.stringify(setup.script.path.trim())}`
      : "",
  ];
  return steps.filter(Boolean).join(" && ");
}

function startSetup(session: Session, setup: ProjectSetup): void {
  const command = setupCommand(setup);
  if (!command) return;
  const terminal = createTerminalForSession({
    sessionId: session.id,
    type: "shell",
    name: "Setup",
    runCommand: command,
  });
  spawnTerminal({
    id: terminal.id,
    type: "shell",
    command: null,
    args: [],
    cwd: session.worktreePath,
    runCommand: command,
  });
}

async function writeIfMissing(path: string, content: string): Promise<void> {
  try {
    await writeFile(path, content, { flag: "wx" });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;
  }
}

async function linkIfMissing(target: string, link: string): Promise<void> {
  try {
    await symlink(target, link);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;
  }
}

export async function startWork(input: StartWorkInput): Promise<Session> {
  const project = projectRepo.getById(input.projectId);
  if (!project) throw new Error(`Project not found: ${input.projectId}`);

  const existing = sessionRepo.getByName(input.name, project.id);
  if (existing && existing.status === "active") {
    throw new Error(`Active session '${input.name}' already exists for this project`);
  }

  const sessionsDir = join(getNexDir(), "sessions", project.name, input.name);
  await mkdir(sessionsDir, { recursive: true });

  const notesPath = join(sessionsDir, "TASK_NOTES.md");
  await writeFile(notesPath, "");

  const sharedPath = join(getNexDir(), "sessions", project.name, "SHARED_CONTEXT.md");
  await writeIfMissing(sharedPath, `# ${project.name} - Shared Context\n`);

  if (!(await isGitRepo(project.path))) {
    const session = sessionRepo.create({
      projectId: project.id,
      agentId: input.agentId,
      accountId: input.accountId,
      name: input.name,
      title: input.title,
      branch: "",
      baseBranch: "",
      worktreePath: project.path,
      notesPath,
      symlinks: [],
      envOff: input.environment === false,
    });
    if (input.agentSettings) saveAgentSettings(session.id, input.agentSettings);
    createPrimaryTerminal(session, input.prompt, input.resumeClaudeSession);
    startTaskEnvironmentOnCreate(session.id);
    return session;
  }

  const [detected] = await Promise.all([detectBaseBranch(project.path), fetchOrigin(project.path)]);
  const baseBranch = input.baseBranch?.trim() || project.baseBranch || detected;
  const upstream = `origin/${baseBranch}`;
  const startPoint =
    project.pullBase && (await refExists(project.path, upstream)) ? upstream : baseBranch;
  const prefix = (project.branchPrefix || "").replace(/\/+$/, "");
  const branch = prefix ? `${prefix}/${input.name}` : input.name;
  const wtPath = join(project.path, ".worktrees", input.name);
  await createWorktree(project.path, branch, wtPath, startPoint);
  await initSubmodules(project.path, wtPath).catch((error: unknown) =>
    console.warn(`Submodules of ${wtPath} weren't checked out:`, error),
  );

  try {
    setupGitExclude(project.path);
    setupSymlinks(project.path, wtPath, [".claude"]);

    await linkIfMissing(notesPath, join(wtPath, "TASK_NOTES.md"));
    await linkIfMissing(sharedPath, join(wtPath, "SHARED_CONTEXT.md"));

    const session = sessionRepo.create({
      projectId: project.id,
      agentId: input.agentId,
      accountId: input.accountId,
      name: input.name,
      title: input.title,
      branch,
      baseBranch,
      worktreePath: wtPath,
      notesPath,
      symlinks: [".claude"],
      envOff: input.environment === false,
    });
    if (input.agentSettings) saveAgentSettings(session.id, input.agentSettings);
    if (project.setup) await copySetupFiles(project.path, wtPath, project.setup);
    if (project.environment?.services.length) {
      await copyEnvFiles(project.path, wtPath, project.environment).catch((error: unknown) =>
        console.warn(`Env files weren't copied into ${wtPath}:`, error),
      );
    }
    createPrimaryTerminal(session, input.prompt, input.resumeClaudeSession);
    if (project.setup) startSetup(session, project.setup);
    startTaskEnvironmentOnCreate(session.id);
    return session;
  } catch (err) {
    await removeWorktree(project.path, wtPath).catch(() => {});
    await deleteBranch(project.path, branch).catch(() => {});
    throw err;
  }
}
