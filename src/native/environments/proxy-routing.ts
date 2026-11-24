import type { IncomingHttpHeaders, OutgoingHttpHeaders } from "http";
import type { EnvHostPort, ProjectEnvironment } from "@native/db/types";
import {
  type AddressDomain,
  LOCAL_DOMAIN,
  mainService,
  NEX_ADDRESS_DOMAIN,
  orderServices,
  originFor,
  portMappings,
  rawPort,
  shortNames,
  webPort,
} from "./definition";
import { containerName } from "./translate";

export interface ProxyPort extends EnvHostPort {
  raw: boolean;
}

export interface ProxyService {
  name: string;
  label: string;
  container: string;
  web: number | undefined;
  ports: ProxyPort[];
}

export interface ProxyTask {
  slug: string;
  startedAt: number;
  paused: boolean;
  main: string | null;
  services: ProxyService[];
}

export interface ProxyTable {
  tasks: readonly ProxyTask[];
  viewing: string | null;
  entryPort: number;
}

export function proxyTask(
  env: ProjectEnvironment,
  slug: string,
  startedAt: number,
  paused: boolean,
): ProxyTask {
  const labels = shortNames(env.services.map((service) => service.name));
  return {
    slug,
    startedAt,
    paused,
    main: mainService(env)?.name ?? null,
    services: orderServices(env.services)
      .filter((service) => service.ports.length > 0)
      .map((service) => ({
        name: service.name,
        label: labels.get(service.name) ?? service.name,
        container: containerName(slug, service.name),
        web: webPort(service),
        ports: portMappings(service).map((port) => ({
          ...port,
          raw: rawPort(service, port.container),
        })),
      })),
  };
}

export const hostPorts = (tasks: readonly ProxyTask[]): number[] =>
  [
    ...new Set(
      tasks
        .filter((task) => !task.paused)
        .flatMap((task) => task.services.flatMap((service) => service.ports.map((p) => p.host))),
    ),
  ].toSorted((a, b) => a - b);

export interface TaskHost {
  slug: string;
  service: string | null;
  domain: AddressDomain;
}

const DOMAINS: readonly AddressDomain[] = [NEX_ADDRESS_DOMAIN, LOCAL_DOMAIN];

export function parseTaskHost(host: string | undefined): TaskHost | null {
  if (!host) return null;
  const name = host.toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
  const domain = DOMAINS.find((item) => name.endsWith(`.${item}`));
  if (!domain) return null;
  const labels = name.slice(0, -domain.length - 1).split(".");
  if (labels.some((label) => !/^[a-z0-9-]+$/.test(label))) return null;
  if (labels.length === 1) return { slug: labels[0] as string, service: null, domain };
  if (labels.length === 2) {
    return { slug: labels[1] as string, service: labels[0] as string, domain };
  }
  return null;
}

export function originOf(value: string | undefined): URL | null {
  if (!value || value === "null") return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

export type RouteVia = "address" | "origin" | "fallback";

export interface Route {
  task: ProxyTask;
  service: ProxyService;
  port: number;
  hostPort: number;
  via: RouteVia;
  domain: AddressDomain | null;
}

export type RouteMiss = { miss: "no-task" | "paused" | "no-service"; slug?: string };

export interface RouteRequest {
  listenPort: number;
  host?: string;
  origin?: string;
  referer?: string;
}

const bySlug = (table: ProxyTable, slug: string) => table.tasks.find((task) => task.slug === slug);

const publishes = (service: ProxyService, hostPort: number) =>
  service.ports.find((port) => port.host === hostPort);

const named = (service: ProxyService, name: string | null | undefined) =>
  Boolean(name) && (service.label === name || service.name === name);

const serviceNamed = (task: ProxyTask, name: string | null) =>
  task.services.find((item) => named(item, name ?? task.main));

function published(
  task: ProxyTask,
  hostPort: number,
  via: RouteVia,
  domain: AddressDomain | null,
  preferred?: string | null,
): Route | null {
  const candidates = task.services.filter((service) => publishes(service, hostPort));
  const service = candidates.find((item) => named(item, preferred)) ?? candidates[0];
  const mapping = service && publishes(service, hostPort);
  return service && mapping
    ? { task, service, port: mapping.container, hostPort: mapping.host, via, domain }
    : null;
}

function fallbackTask(table: ProxyTable, hostPort: number): ProxyTask | undefined {
  const running = table.tasks.filter(
    (task) => !task.paused && task.services.some((service) => publishes(service, hostPort)),
  );
  return (
    running.find((task) => task.slug === table.viewing) ??
    running.toSorted((a, b) => b.startedAt - a.startedAt)[0]
  );
}

const hostPortOf = (service: ProxyService, container: number) =>
  service.ports.find((port) => port.container === container)?.host ?? container;

const publishedByAny = (table: ProxyTable, hostPort: number) =>
  table.tasks.some((task) => task.services.some((service) => publishes(service, hostPort)));

export function routeRequest(table: ProxyTable, request: RouteRequest): Route | RouteMiss {
  const host = parseTaskHost(request.host);
  if (host) {
    const task = bySlug(table, host.slug);
    if (!task) return { miss: "no-task", slug: host.slug };
    if (task.paused) return { miss: "paused", slug: task.slug };
    if (request.listenPort !== table.entryPort) {
      return (
        published(task, request.listenPort, "address", host.domain, host.service) ?? {
          miss: "no-service",
          slug: task.slug,
        }
      );
    }
    const service = serviceNamed(task, host.service);
    const port = service?.web ?? service?.ports[0]?.container;
    if (!service || port === undefined) return { miss: "no-service", slug: task.slug };
    const hostPort = hostPortOf(service, port);
    return { task, service, port, hostPort, via: "address", domain: host.domain };
  }
  if (request.listenPort === table.entryPort && !publishedByAny(table, request.listenPort)) {
    return { miss: "no-task" };
  }
  const from = parseTaskHost(
    originOf(request.origin)?.host ?? originOf(request.referer)?.host ?? undefined,
  );
  const origin = from && bySlug(table, from.slug);
  const direct = origin && !origin.paused && published(origin, request.listenPort, "origin", null);
  if (direct) return direct;
  return rawRoute(table, request.listenPort) ?? { miss: "no-task" };
}

export function rawRoute(table: ProxyTable, listenPort: number): Route | null {
  const fallback = fallbackTask(table, listenPort);
  return (fallback && published(fallback, listenPort, "fallback", null)) ?? null;
}

export function speaksRaw(table: ProxyTable, listenPort: number): boolean {
  const route = rawRoute(table, listenPort);
  return Boolean(route && publishes(route.service, listenPort)?.raw);
}

export const isRoute = (result: Route | RouteMiss): result is Route => "task" in result;

export function taskOrigin(
  table: ProxyTable,
  task: ProxyTask,
  service: ProxyService,
  domain: AddressDomain,
): string {
  const address =
    task.main === service.name
      ? `${task.slug}.${domain}`
      : `${service.label}.${task.slug}.${domain}`;
  return originFor(address, table.entryPort);
}

export function composeOrigin(table: ProxyTable, value: string | undefined): string | undefined {
  const url = originOf(value);
  const host = parseTaskHost(url?.host);
  const task = host && bySlug(table, host.slug);
  if (!task) return undefined;
  const service = serviceNamed(task, host.service);
  const port = service?.web ?? service?.ports[0]?.container;
  if (!service || port === undefined) return undefined;
  return `http://localhost:${hostPortOf(service, port)}`;
}

const HOP_BY_HOP = ["connection", "keep-alive", "proxy-connection", "upgrade", "te", "trailer"];

export interface ForwardedRequest {
  headers: OutgoingHttpHeaders;
  origin?: { real: string; compose: string };
}

export function forwardedHeaders(
  table: ProxyTable,
  route: Route,
  incoming: IncomingHttpHeaders,
  upgrade = false,
): ForwardedRequest {
  const headers: OutgoingHttpHeaders = {};
  for (const [name, value] of Object.entries(incoming)) {
    if (value === undefined || (!upgrade && HOP_BY_HOP.includes(name))) continue;
    headers[name] = value;
  }
  headers.host = `localhost:${route.hostPort}`;
  const real = originOf(incoming.origin)?.origin;
  const compose = composeOrigin(table, incoming.origin);
  if (real && compose) headers.origin = compose;
  const referer = originOf(incoming.referer);
  const composeReferer = referer && composeOrigin(table, referer.origin);
  if (referer && composeReferer) {
    headers.referer = `${composeReferer}${referer.href.slice(referer.origin.length)}`;
  }
  return { headers, ...(real && compose ? { origin: { real, compose } } : {}) };
}

const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]"]);

function rewrittenLocation(table: ProxyTable, route: Route, value: string): string {
  if (route.via !== "address" || !route.domain) return value;
  const url = originOf(value);
  if (!url || !LOOPBACK.has(url.hostname) || !url.port) return value;
  const target = published(route.task, Number(url.port), "address", route.domain);
  if (!target) return value;
  const origin = taskOrigin(table, route.task, target.service, route.domain);
  return `${origin}${url.href.slice(url.origin.length)}`;
}

export function returnedHeaders(
  table: ProxyTable,
  route: Route,
  forwarded: ForwardedRequest,
  headers: IncomingHttpHeaders,
): OutgoingHttpHeaders {
  const result: OutgoingHttpHeaders = { ...headers };
  delete result.connection;
  delete result["keep-alive"];
  const allowed = headers["access-control-allow-origin"];
  if (forwarded.origin && allowed === forwarded.origin.compose) {
    result["access-control-allow-origin"] = forwarded.origin.real;
  }
  if (typeof headers.location === "string") {
    result.location = rewrittenLocation(table, route, headers.location);
  }
  return result;
}

const HTTP_START = /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS|CONNECT|TRACE) /;

export const looksLikeHttp = (chunk: Buffer) => HTTP_START.test(chunk.subarray(0, 8).toString());

export function requestHead(method: string, path: string, headers: OutgoingHttpHeaders): string {
  const lines = Object.entries(headers).flatMap(([name, value]) =>
    value === undefined
      ? []
      : (Array.isArray(value) ? value : [value]).map((item) => `${name}: ${item}`),
  );
  return `${method} ${path} HTTP/1.1\r\n${lines.join("\r\n")}\r\n\r\n`;
}

export function listeningPorts(lsofOutput: string, ownPid: number): number[] {
  const ports = new Set<number>();
  let pid = 0;
  for (const line of lsofOutput.split("\n")) {
    if (line.startsWith("p")) pid = Number(line.slice(1));
    else if (line.startsWith("n") && pid !== ownPid) {
      const port = Number(/:(\d+)$/.exec(line)?.[1]);
      if (port) ports.add(port);
    }
  }
  return [...ports].toSorted((a, b) => a - b);
}

export const isLoopback = (address: string | undefined) =>
  address === "::1" || /^(::ffff:)?127\.\d+\.\d+\.\d+$/.test(address ?? "");
