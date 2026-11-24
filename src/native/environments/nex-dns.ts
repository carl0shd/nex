import dgram from "dgram";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import * as settings from "@native/db/repositories/settings.repo";
import type { EnvLog } from "./cli";
import { answerQuery, errorReply, LOOPBACK_RECORDS, parseQuery } from "./dns-packet";
import { envInstance } from "./instance";
import { NEX_DOMAIN } from "./labels";
import {
  addressesRegistered,
  discoveryCommands,
  DISCOVERY_RESOLVER,
  DNS_HOST,
  DNS_PORTS,
  LEGACY_RESOLVER,
  NEX_RESOLVER,
  registerCommands,
  resolverContents,
  unregisterCommands,
  type ResolverFiles,
} from "./resolver-file";

const PORT_KEY = "nexDnsPort";
let port: number | null = null;
let starting: Promise<number | null> | null = null;
let registered = false;
const listeners = new Set<() => void>();

function reply(server: dgram.Socket, packet: Buffer, info: dgram.RemoteInfo) {
  const question = parseQuery(packet);
  const answer = question
    ? answerQuery(question, NEX_DOMAIN, LOOPBACK_RECORDS)
    : errorReply(packet);
  if (answer) server.send(answer, info.port, info.address);
}

function bind(candidate: number): Promise<dgram.Socket | null> {
  return new Promise((resolve) => {
    const server = dgram.createSocket({ type: "udp4", reuseAddr: false });
    server.once("error", () => {
      server.close();
      resolve(null);
    });
    server.bind({ port: candidate, address: DNS_HOST, exclusive: true }, () => {
      server.removeAllListeners("error");
      server.on("error", () => {});
      server.on("message", (packet, info) => {
        try {
          reply(server, packet, info);
        } catch {}
      });
      resolve(server);
    });
  });
}

async function listen(log?: EnvLog): Promise<number | null> {
  const stored = settings.get<number | null>(PORT_KEY, null);
  const order = [...new Set([...(stored ? [stored] : []), ...DNS_PORTS])];
  for (const candidate of order) {
    if (await bind(candidate)) {
      if (candidate !== stored) settings.set(PORT_KEY, candidate);
      log?.(`.nex names answered on ${DNS_HOST}:${candidate}`);
      return candidate;
    }
  }
  log?.(`No free port for .nex names between ${DNS_PORTS[0]} and ${DNS_PORTS.at(-1)}`);
  return null;
}

export function startNexDns(log?: EnvLog): Promise<number | null> {
  if (!envInstance().ownsMacNetwork) return Promise.resolve(null);
  starting ??= listen(log).then((bound) => {
    port = bound;
    refreshNexAddresses();
    return bound;
  });
  return starting;
}

export const nexDnsPort = () => port;

function readText(path: string): string | null {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

export const resolverFiles = (): ResolverFiles => ({
  nex: readText(NEX_RESOLVER),
  discovery: existsSync(DISCOVERY_RESOLVER),
  legacy: existsSync(LEGACY_RESOLVER),
});

export const nexAddressesOn = () => registered && envInstance().ownsMacNetwork;

export function refreshNexAddresses(): boolean {
  const files = resolverFiles();
  const next = envInstance().ownsMacNetwork ? addressesRegistered(files, port) : files.discovery;
  if (next !== registered) {
    registered = next;
    for (const listener of listeners) listener();
  }
  return registered;
}

export function onNexAddressesChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function registerAddressCommands(
  dir: string,
  containerBinary: string,
): Promise<string[][]> {
  if (!envInstance().ownsMacNetwork) return discoveryCommands(resolverFiles(), containerBinary);
  const bound = await startNexDns();
  if (bound === null) throw new Error("Nex couldn’t find a free port to answer .nex names.");
  mkdirSync(dir, { recursive: true });
  const staged = join(dir, "resolver-nex");
  writeFileSync(staged, resolverContents(bound));
  return registerCommands(staged, resolverFiles(), containerBinary);
}

export const unregisterAddressCommands = () =>
  envInstance().ownsMacNetwork ? unregisterCommands(resolverFiles()) : [];
