import { execFile } from "child_process";
import * as agentRepo from "@native/db/repositories/agent.repo";

const VERSION_TIMEOUT_MS = 4000;
const SEMVER = /\d+\.\d+\.\d+/;

export function binaryVersion(command: string): Promise<string | null> {
  return new Promise((resolve) => {
    execFile(command, ["--version"], { timeout: VERSION_TIMEOUT_MS }, (err, stdout) => {
      resolve(err ? null : (stdout.match(SEMVER)?.[0] ?? null));
    });
  });
}

export function getAgentVersion(agentId: string): Promise<string | null> {
  const agent = agentRepo.getById(agentId);
  return agent ? binaryVersion(agent.command) : Promise.resolve(null);
}

const UPDATE_TIMEOUT_MS = 5 * 60_000;

export function upgradeAgent(agentId: string): Promise<string | null> {
  const agent = agentRepo.getById(agentId);
  if (!agent) return Promise.resolve(null);
  return new Promise((resolve) => {
    execFile(agent.command, ["update"], { timeout: UPDATE_TIMEOUT_MS }, () =>
      resolve(binaryVersion(agent.command)),
    );
  });
}
