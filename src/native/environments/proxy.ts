import http, { type IncomingMessage, type ServerResponse } from "http";
import net from "net";
import type { Duplex } from "stream";
import { run } from "./cli";
import { ENTRY_PORT, WEB_ENTRY_PORT } from "./definition";
import {
  forwardedHeaders,
  hostPorts,
  isLoopback,
  isRoute,
  listeningPorts,
  looksLikeHttp,
  rawRoute,
  requestHead,
  returnedHeaders,
  routeRequest,
  speaksRaw,
  type ProxyTable,
  type ProxyTask,
  type Route,
  type RouteMiss,
} from "./proxy-routing";
import type { BlockedPort, BlockedReason } from "./types";

const ENTRY_TRIES = 10;
const PROBE_MS = 300;
const CONNECT_MS = 5_000;
const ADDRESS_FRESH_MS = 2_000;
const LSOF = "/usr/sbin/lsof";
const LOOPBACKS = ["127.0.0.1", "::1"] as const;
const WILDCARDS = ["0.0.0.0", "::"] as const;
const STALE_ADDRESS = new Set(["ECONNREFUSED", "EHOSTUNREACH", "ENETUNREACH", "ETIMEDOUT"]);

export interface ProxyOptions {
  resolve: (container: string) => Promise<string | null>;
  log?: (line: string) => void;
}

let options: ProxyOptions = { resolve: async () => null };
let table: ProxyTable = { tasks: [], viewing: null, entryPort: WEB_ENTRY_PORT };
const listening = new Map<number, net.Server[]>();
const blocked = new Map<number, BlockedReason>();
const addresses = new Map<string, { ip: string | null; at: number }>();
const lookups = new Map<string, Promise<string | null>>();
const changeListeners = new Set<() => void>();
let syncing: Promise<void> = Promise.resolve();
let entryBound = false;

const agent = new http.Agent({ keepAlive: true, maxSockets: 64 });
const server = http.createServer();

export function configureProxy(next: ProxyOptions): void {
  options = next;
}

export const proxyEntryPort = () => table.entryPort;

export const blockedPorts = (): BlockedPort[] =>
  [...blocked].map(([port, reason]) => ({ port, reason })).toSorted((a, b) => a.port - b.port);

export function onProxyChange(listener: () => void): () => void {
  changeListeners.add(listener);
  return () => changeListeners.delete(listener);
}

const changed = () => {
  for (const listener of changeListeners) listener();
};

export function forgetAddresses(slug?: string): void {
  for (const name of addresses.keys()) {
    if (!slug || name.startsWith(`nex-${slug}-`)) addresses.delete(name);
  }
}

async function addressOf(container: string, fresh = false): Promise<string | null> {
  const cached = addresses.get(container);
  if (!fresh && cached && Date.now() - cached.at < ADDRESS_FRESH_MS) return cached.ip;
  const pending = lookups.get(container);
  if (pending) return pending;
  const lookup = options
    .resolve(container)
    .catch(() => null)
    .then((ip) => {
      addresses.set(container, { ip, at: Date.now() });
      return ip;
    })
    .finally(() => lookups.delete(container));
  lookups.set(container, lookup);
  return lookup;
}

function answers(port: number, host: string): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host });
    const done = (result: boolean) => {
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(PROBE_MS, () => done(false));
    socket.once("connect", () => done(true));
    socket.once("error", () => done(false));
  });
}

type ListenerKind = "entry" | "host";

// A wildcard bind also accepts the LAN, so anything not from this Mac is closed before a byte is read.
function accept(socket: net.Socket, kind: ListenerKind) {
  if (!isLoopback(socket.remoteAddress)) return void socket.destroy();
  if (kind === "entry") return void server.emit("connection", socket);
  socket.on("error", () => socket.destroy());
  if (speaksRaw(table, socket.localPort ?? 0)) void pipeRaw(socket);
  else sniffConnection(socket);
}

function listenOn(port: number, host: string, kind: ListenerKind): Promise<net.Server | string> {
  return new Promise((resolve) => {
    const listener = net.createServer({ pauseOnConnect: kind === "host" }, (socket) =>
      accept(socket, kind),
    );
    listener.once("error", (error: NodeJS.ErrnoException) => resolve(error.code ?? "EADDRINUSE"));
    listener.listen({ port, host, ipv6Only: host === "::" }, () => {
      listener.removeAllListeners("error");
      listener.on("error", () => {});
      resolve(listener);
    });
  });
}

// Node sets SO_REUSEADDR, so binding 127.0.0.1 succeeds even when another app holds the port on
// every address and would silently shadow it; asking the port first is the only reliable check.
async function open(
  port: number,
  kind: ListenerKind,
  hosts: readonly [string, string] = LOOPBACKS,
): Promise<BlockedReason | null> {
  const taken = await Promise.all(LOOPBACKS.map((host) => answers(port, host)));
  if (taken.some(Boolean)) return "taken";
  const primary = await listenOn(port, hosts[0], kind);
  if (typeof primary === "string") return primary === "EACCES" ? "denied" : "taken";
  const servers = [primary];
  const second = await listenOn(port, hosts[1], kind);
  if (typeof second !== "string") servers.push(second);
  listening.set(port, servers);
  return null;
}

function close(port: number) {
  for (const listener of listening.get(port) ?? []) listener.close();
  listening.delete(port);
}

// macOS lets an unprivileged app bind port 80 only on the wildcard address, never on 127.0.0.1.
const ENTRY_CANDIDATES: readonly { port: number; hosts: readonly [string, string] }[] = [
  { port: WEB_ENTRY_PORT, hosts: WILDCARDS },
  ...Array.from({ length: ENTRY_TRIES }, (_, offset) => ({
    port: ENTRY_PORT + offset,
    hosts: LOOPBACKS,
  })),
];

async function openEntry(): Promise<void> {
  for (const { port, hosts } of ENTRY_CANDIDATES) {
    if (listening.has(port)) continue;
    if ((await open(port, "entry", hosts)) === null) {
      table = { ...table, entryPort: port };
      entryBound = true;
      options.log?.(`Task addresses on port ${port}`);
      return;
    }
  }
}

const snapshot = () => JSON.stringify([table.entryPort, blockedPorts()]);

async function reconcile(retry: boolean, before = snapshot()): Promise<void> {
  const wanted = new Set(hostPorts(table.tasks));
  const wantEntry = table.tasks.length > 0;
  if (!wantEntry && entryBound) {
    close(table.entryPort);
    entryBound = false;
  }
  for (const port of [...listening.keys()]) {
    if (!(entryBound && port === table.entryPort) && !wanted.has(port)) close(port);
  }
  for (const port of [...blocked.keys()]) if (!wanted.has(port)) blocked.delete(port);
  if (wantEntry && !entryBound) await openEntry();
  for (const port of wanted) {
    if (listening.has(port) || (entryBound && port === table.entryPort)) continue;
    if (blocked.has(port) && !retry) continue;
    const reason = await open(port, "host");
    if (reason) blocked.set(port, reason);
    else blocked.delete(port);
  }
  if (snapshot() !== before) changed();
}

function schedule(retry = false, before?: string): Promise<void> {
  const next = () => reconcile(retry, before);
  syncing = syncing.then(next, next).catch(() => {});
  return syncing;
}

export function setProxyTasks(tasks: readonly ProxyTask[], viewing: string | null): Promise<void> {
  const samePorts = JSON.stringify(hostPorts(tasks)) === JSON.stringify(hostPorts(table.tasks));
  const sameEntry = Boolean(tasks.length) === Boolean(table.tasks.length);
  table = { ...table, tasks, viewing };
  return samePorts && sameEntry ? syncing : schedule();
}

export async function checkProxyPorts(): Promise<void> {
  await syncing;
  const before = snapshot();
  const held = [...listening.keys()].filter((port) => !(entryBound && port === table.entryPort));
  if (held.length > 0) {
    const result = await run(LSOF, ["-nP", `-iTCP:${held.join(",")}`, "-sTCP:LISTEN", "-Fpn"], {
      timeoutMs: 5_000,
    });
    const foreign = new Set(listeningPorts(result.stdout, process.pid));
    for (const port of held.filter((item) => foreign.has(item))) {
      options.log?.(`Port ${port} is used by another app, so Nex lets it go`);
      close(port);
      blocked.set(port, "taken");
    }
  }
  await schedule(true, before);
}

function sniffConnection(socket: net.Socket) {
  socket.once("data", (chunk: Buffer) => {
    socket.pause();
    socket.unshift(chunk);
    if (!looksLikeHttp(chunk)) return void pipeRaw(socket);
    server.emit("connection", socket);
    socket.resume();
  });
  socket.resume();
}

async function pipeRaw(socket: net.Socket, stale?: string) {
  const target = rawRoute(table, socket.localPort ?? 0);
  const ip = target ? await addressOf(target.service.container, stale !== undefined) : null;
  if (!target || !ip || ip === stale || socket.destroyed) return void socket.destroy();
  const upstream = net.connect({ host: ip, port: target.port });
  let connected = false;
  upstream.setTimeout(CONNECT_MS, () =>
    upstream.destroy(Object.assign(new Error("timeout"), { code: "ETIMEDOUT" })),
  );
  upstream.on("error", (error: NodeJS.ErrnoException) => {
    if (!connected && stale === undefined && STALE_ADDRESS.has(error.code ?? "")) {
      return void pipeRaw(socket, ip);
    }
    socket.destroy();
  });
  const closeUpstream = () => upstream.destroy();
  socket.once("close", closeUpstream);
  upstream.once("close", () => socket.off("close", closeUpstream));
  upstream.once("connect", () => {
    connected = true;
    upstream.setTimeout(0);
    socket.pipe(upstream);
    upstream.pipe(socket);
  });
}

const MISS_TEXT: Record<RouteMiss["miss"], (slug?: string) => string> = {
  "no-task": () => "Nex has no running task at this address.",
  paused: (slug) =>
    `The environment of ${slug ?? "this task"} is paused. Open the task in Nex to resume it.`,
  "no-service": (slug) => `${slug ?? "This task"} has nothing to open here.`,
};

function plain(res: ServerResponse, status: number, text: string) {
  if (res.headersSent) return void res.destroy();
  res.writeHead(status, {
    "content-type": "text/plain; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(`${text}\n`);
}

const notAnswering = (route: Route) =>
  `${route.service.name} in ${route.task.slug} isn’t answering on port ${route.port} yet.`;

function route(req: IncomingMessage): Route | RouteMiss {
  return routeRequest(table, {
    listenPort: req.socket.localPort ?? 0,
    host: req.headers.host,
    origin: req.headers.origin,
    referer: req.headers.referer,
  });
}

const bodyless = (req: IncomingMessage) =>
  (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") &&
  !req.headers["content-length"] &&
  !req.headers["transfer-encoding"];

function forward(
  req: IncomingMessage,
  res: ServerResponse,
  target: Route,
  ip: string,
  attempt = 0,
) {
  const forwarded = forwardedHeaders(table, target, req.headers);
  const upstream = http.request({
    host: ip,
    port: target.port,
    method: req.method,
    path: req.url,
    headers: forwarded.headers,
    agent,
  });
  const connectTimer = setTimeout(
    () => upstream.destroy(Object.assign(new Error("timeout"), { code: "ETIMEDOUT" })),
    CONNECT_MS,
  );
  upstream.once("socket", (socket) => {
    if (!socket.connecting) clearTimeout(connectTimer);
    else socket.once("connect", () => clearTimeout(connectTimer));
  });
  upstream.on("response", (answer) => {
    clearTimeout(connectTimer);
    res.writeHead(
      answer.statusCode ?? 502,
      answer.statusMessage,
      returnedHeaders(table, target, forwarded, answer.headers),
    );
    answer.pipe(res);
  });
  upstream.on("error", (error: NodeJS.ErrnoException) => {
    clearTimeout(connectTimer);
    if (!STALE_ADDRESS.has(error.code ?? "")) return plain(res, 502, notAnswering(target));
    void addressOf(target.service.container, true).then((fresh) => {
      if (bodyless(req) && attempt === 0 && fresh && fresh !== ip) {
        forward(req, res, target, fresh, 1);
      } else plain(res, 502, notAnswering(target));
    });
  });
  res.on("close", () => {
    if (!res.writableFinished) upstream.destroy();
  });
  if (bodyless(req)) upstream.end();
  else req.pipe(upstream);
}

server.on("request", async (req: IncomingMessage, res: ServerResponse) => {
  const target = route(req);
  if (!isRoute(target))
    return plain(res, target.miss === "paused" ? 503 : 404, MISS_TEXT[target.miss](target.slug));
  const ip = await addressOf(target.service.container);
  if (!ip) return plain(res, 502, notAnswering(target));
  forward(req, res, target, ip);
});

server.on("upgrade", async (req: IncomingMessage, socket: Duplex, head: Buffer) => {
  socket.on("error", () => socket.destroy());
  const target = route(req);
  const ip = isRoute(target) ? await addressOf(target.service.container) : null;
  if (!isRoute(target) || !ip) {
    return void socket.end("HTTP/1.1 502 Bad Gateway\r\nconnection: close\r\n\r\n");
  }
  const upstream = net.connect({ host: ip, port: target.port });
  upstream.setTimeout(CONNECT_MS, () => upstream.destroy());
  upstream.on("error", () => socket.destroy());
  socket.on("close", () => upstream.destroy());
  upstream.once("connect", () => {
    upstream.setTimeout(0);
    const { headers } = forwardedHeaders(table, target, req.headers, true);
    upstream.write(requestHead(req.method ?? "GET", req.url ?? "/", headers));
    if (head.length > 0) upstream.write(head);
    socket.pipe(upstream);
    upstream.pipe(socket);
  });
});

server.on("clientError", (_error, socket) => socket.destroy());
