import { spawn, type IPty } from "node-pty";
import { BrowserWindow } from "electron";
import { execFile } from "child_process";
import { randomUUID } from "crypto";
import { mkdirSync, rmSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { copyAgentConfig } from "@native/agents/clone-account";
import { installAgent } from "@native/agents/detect";
import * as agentRepo from "@native/db/repositories/agent.repo";
import * as agentAccountRepo from "@native/db/repositories/agent-account.repo";
import type { Agent, AgentAccount } from "@native/db/types";
import { IPC } from "@native/ipc/channels";
import { getNexDir } from "@native/paths";
import { stripAnsi } from "@native/pty/status-detector";
import { resolveKeychainService } from "@native/usage/binding";
import { emailForConfigDir, refreshCredentials } from "@native/usage/credentials";

const CLAUDE_SLUG = "claude-code";
const SIGN_IN_TIMEOUT_MS = 5 * 60_000;
const URL_PATTERN = /https:\/\/[^\s"'<>]+/;

export type ReauthResult =
  | { status: "signed-in"; email: string; sameAccount: boolean }
  | { status: "failed"; url: string | null }
  | { status: "cancelled" };

export type SignInResult =
  | { status: "signed-in"; email: string; configDir: string }
  | { status: "exists"; email: string; name: string }
  | { status: "failed"; url: string | null }
  | { status: "cancelled" };

export interface FinishSignInInput {
  configDir: string;
  email: string;
  name: string;
  color: string;
  isDefault: boolean;
}

let running: { pty: IPty; configDir: string; cancelled: boolean } | null = null;
const pending = new Set<string>();

const accountsRoot = () => join(getNexDir(), "accounts");

function removePending(configDir: string): void {
  if (!pending.delete(configDir)) return;
  rmSync(configDir, { recursive: true, force: true });
}

async function claudeAgent(): Promise<Agent> {
  return agentRepo.getBySlug(CLAUDE_SLUG) ?? (await installAgent(CLAUDE_SLUG)).agent;
}

function broadcastUrl(url: string): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(IPC.ACCOUNT_SIGN_IN_URL, url);
  }
}

async function knownAccount(agent: Agent, email: string): Promise<string | null> {
  const saved = agentAccountRepo
    .getByAgent(agent.id)
    .find((account) => (account.email ?? account.name) === email);
  if (saved) return saved.name;
  if (!agent.command || !agent.defaultConfigDir) return null;
  const defaultEmail = await emailForConfigDir(agent.command, agent.defaultConfigDir);
  return defaultEmail === email ? email : null;
}

async function runLogin(
  command: string,
  configDir: string,
  env: Record<string, string>,
): Promise<{ exitCode: number; url: string | null; cancelled: boolean }> {
  const pty = spawn(command, ["auth", "login"], { cwd: homedir(), cols: 4000, rows: 40, env });
  const current = { pty, configDir, cancelled: false };
  running = current;

  let url: string | null = null;
  let output = "";
  pty.onData((data) => {
    if (url) return;
    output += stripAnsi(data);
    const match = output.match(URL_PATTERN);
    if (match) {
      url = match[0];
      broadcastUrl(url);
    }
  });

  const timer = setTimeout(() => pty.kill(), SIGN_IN_TIMEOUT_MS);
  const exitCode = await new Promise<number>((resolve) =>
    pty.onExit(({ exitCode }) => resolve(exitCode)),
  );
  clearTimeout(timer);
  if (running === current) running = null;
  return { exitCode, url, cancelled: current.cancelled };
}

export async function signInAccount(): Promise<SignInResult> {
  cancelSignIn();
  const agent = await claudeAgent();
  if (!agent.command) return { status: "failed", url: null };

  const configDir = join(accountsRoot(), randomUUID());
  mkdirSync(configDir, { recursive: true });
  pending.add(configDir);
  if (agent.defaultConfigDir) copyAgentConfig(agent.defaultConfigDir, configDir);

  const { exitCode, url, cancelled } = await runLogin(agent.command, configDir, {
    ...(process.env as Record<string, string>),
    CLAUDE_CONFIG_DIR: configDir,
  });

  if (cancelled) {
    removePending(configDir);
    return { status: "cancelled" };
  }
  const email = exitCode === 0 ? await emailForConfigDir(agent.command, configDir) : null;
  if (!email) {
    removePending(configDir);
    return { status: "failed", url };
  }
  const existing = await knownAccount(agent, email);
  if (existing) {
    removePending(configDir);
    return { status: "exists", email, name: existing };
  }
  return { status: "signed-in", email, configDir };
}

export function cancelSignIn(): void {
  if (!running) return;
  running.cancelled = true;
  running.pty.kill();
}

export async function finishSignIn(input: FinishSignInInput): Promise<AgentAccount> {
  if (!pending.has(input.configDir)) throw new Error("No sign-in waiting for this profile");
  const agent = await claudeAgent();
  const account = agentAccountRepo.create({
    agentId: agent.id,
    name: input.name,
    configDir: input.configDir,
    isDefault: input.isDefault,
    email: input.email,
    color: input.color,
  });
  pending.delete(input.configDir);
  return account;
}

export function discardSignIn(configDir: string): void {
  removePending(configDir);
}

function logout(command: string, env: Record<string, string>): Promise<void> {
  return new Promise((resolve) => {
    execFile(command, ["auth", "logout"], { env, timeout: 15_000 }, () => resolve());
  });
}

export async function reauthAccount(accountId: string): Promise<ReauthResult> {
  cancelSignIn();
  const agent = await claudeAgent();
  const account = agentAccountRepo.getById(accountId);
  if (!agent.command || !account) return { status: "failed", url: null };

  const known = account.email ?? (account.name.includes("@") ? account.name : null);
  const service = await resolveKeychainService(account);
  if (await refreshCredentials(service, account.configDir)) {
    return { status: "signed-in", email: known ?? "", sameAccount: true };
  }

  const env = { ...(process.env as Record<string, string>) };
  if (agent.configEnvVar && account.configDir !== agent.defaultConfigDir) {
    env[agent.configEnvVar] = account.configDir;
  }
  await logout(agent.command, env);
  const { exitCode, url, cancelled } = await runLogin(agent.command, account.configDir, env);
  if (cancelled) return { status: "cancelled" };
  const email = exitCode === 0 ? await emailForConfigDir(agent.command, account.configDir) : null;
  if (!email) return { status: "failed", url };
  if (!account.email) agentAccountRepo.update(account.id, { email });
  return { status: "signed-in", email, sameAccount: !known || known === email };
}
