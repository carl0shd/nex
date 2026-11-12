import { createWriteStream, existsSync, mkdirSync, renameSync, rmSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { Readable, Transform } from "stream";
import { pipeline } from "stream/promises";
import type { ReadableStream as WebReadableStream } from "stream/web";
import { whichBinary } from "@native/which";
import { run, runOk, type EnvLog } from "./cli";
import { NEX_DOMAIN } from "./labels";
import {
  adminAppleScript,
  compareVersions,
  parseLines,
  parseSystemRunning,
  parseVersion,
  unsupportedReason,
} from "./parse";
import type { EnvUnsupportedReason } from "./types";

export const RUNTIME_VERSION = "1.7.1";
export const MIN_RUNTIME_VERSION = "1.7.0";

const INSTALLED_BINARY = "/usr/local/bin/container";
const UNINSTALL_SCRIPT = "/usr/local/bin/uninstall-container.sh";
const APPLE_SIGNER = "Developer ID Installer: Apple Inc.";
const SYSTEM_START_TIMEOUT_MS = 10 * 60_000;
const ADMIN_TIMEOUT_MS = 10 * 60_000;
const APPLE_CONTAINER_DIR = join(homedir(), "Library/Application Support/com.apple.container");
const CONTENT_BLOBS = join(APPLE_CONTAINER_DIR, "content/blobs/sha256");

export const volumeImagePath = (name: string) =>
  join(APPLE_CONTAINER_DIR, "volumes", name, "volume.img");

const pkgUrl = (version: string) =>
  `https://github.com/apple/container/releases/download/${version}/container-${version}-installer-signed.pkg`;

export interface HostSupport {
  macos: string;
  reason: EnvUnsupportedReason | null;
}

export async function detectSupport(): Promise<HostSupport> {
  const [macos, arm] = await Promise.all([
    run("sw_vers", ["-productVersion"]).then((result) => result.stdout.trim()),
    run("sysctl", ["-n", "hw.optional.arm64"]).then((result) => result.stdout.trim() === "1"),
  ]);
  return { macos, reason: unsupportedReason(macos, arm || process.arch === "arm64") };
}

export interface RuntimeInfo {
  installed: boolean;
  version: string | null;
  path: string | null;
  compatible: boolean;
}

export function containerPath(): string | null {
  return existsSync(INSTALLED_BINARY) ? INSTALLED_BINARY : whichBinary("container");
}

export async function detectRuntime(): Promise<RuntimeInfo> {
  const path = containerPath();
  if (!path) return { installed: false, version: null, path: null, compatible: false };
  const version = parseVersion((await run(path, ["--version"])).stdout);
  return {
    installed: true,
    version,
    path,
    compatible: Boolean(version && compareVersions(version, MIN_RUNTIME_VERSION) >= 0),
  };
}

export function container(): string {
  const path = containerPath();
  if (!path) throw new Error("Apple container isn’t installed.");
  return path;
}

export async function systemRunning(): Promise<boolean> {
  const path = containerPath();
  if (!path) return false;
  const result = await run(path, ["system", "status", "--format", "json"]);
  return result.code === 0 && parseSystemRunning(result.stdout);
}

export async function startSystem(log: EnvLog): Promise<void> {
  await runOk(container(), ["system", "start", "--enable-kernel-install"], {
    log,
    timeoutMs: SYSTEM_START_TIMEOUT_MS,
  });
}

export async function stopSystem(log: EnvLog): Promise<void> {
  await runOk(container(), ["system", "stop"], { log, timeoutMs: 120_000 });
}

export function ensureContentStore(): void {
  // Apple container 1.7.1 never creates its blob folder after a fresh install, so the first pull fails.
  mkdirSync(CONTENT_BLOBS, { recursive: true });
}

export async function domainRegistered(): Promise<boolean> {
  const path = containerPath();
  if (!path) return false;
  const result = await run(path, ["system", "dns", "ls", "--quiet"]);
  return result.code === 0 && parseLines(result.stdout).includes(NEX_DOMAIN);
}

export const domainCommand = (action: "create" | "delete", binary = container()) => [
  binary,
  "system",
  "dns",
  action,
  NEX_DOMAIN,
];

export const uninstallScript = (deleteData: boolean) => [
  UNINSTALL_SCRIPT,
  deleteData ? "-d" : "-k",
];

export async function runAsAdmin(
  commands: readonly (readonly string[])[],
  log: EnvLog,
): Promise<void> {
  if (commands.length === 0) return;
  await runOk("osascript", ["-e", adminAppleScript(commands)], {
    log,
    timeoutMs: ADMIN_TIMEOUT_MS,
  });
}

export async function downloadRuntime(
  dir: string,
  onProgress: (received: number, total: number) => void,
  log: EnvLog,
): Promise<string> {
  mkdirSync(dir, { recursive: true });
  const target = join(dir, `container-${RUNTIME_VERSION}.pkg`);
  const partial = `${target}.part`;
  const url = pkgUrl(RUNTIME_VERSION);
  log(`Downloading ${url}`);
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Couldn’t download Apple container (HTTP ${response.status}).`);
  }
  const total = Number(response.headers.get("content-length")) || 0;
  let received = 0;
  const counter = new Transform({
    transform(chunk: Buffer, _encoding, done) {
      received += chunk.length;
      onProgress(received, total);
      done(null, chunk);
    },
  });
  try {
    await pipeline(
      Readable.fromWeb(response.body as WebReadableStream<Uint8Array>),
      counter,
      createWriteStream(partial),
    );
  } catch (error) {
    rmSync(partial, { force: true });
    throw new Error("The download stopped. Check your connection and try again.", {
      cause: error,
    });
  }
  renameSync(partial, target);
  log(`Downloaded ${received} bytes to ${target}`);
  return target;
}

export async function verifyPackage(pkg: string, log: EnvLog): Promise<void> {
  const result = await run("pkgutil", ["--check-signature", pkg], { log });
  if (result.code !== 0 || !result.stdout.includes(APPLE_SIGNER)) {
    rmSync(pkg, { force: true });
    throw new Error("The downloaded package isn’t signed by Apple.");
  }
}

export async function installRuntime(
  pkg: string,
  { registerDomain }: { registerDomain: boolean },
  log: EnvLog,
): Promise<void> {
  const install = ["/usr/sbin/installer", "-pkg", pkg, "-target", "/"];
  const register = registerDomain ? [domainCommand("create", INSTALLED_BINARY)] : [];
  try {
    await runAsAdmin([install, ...register], log);
  } finally {
    rmSync(pkg, { force: true });
  }
}
