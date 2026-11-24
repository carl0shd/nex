import { DISCOVERY_DOMAIN } from "./definition";
import { NEX_DOMAIN } from "./labels";

export const RESOLVER_DIR = "/etc/resolver";
export const NEX_RESOLVER = `${RESOLVER_DIR}/nex`;
const APPLE_PREFIX = `${RESOLVER_DIR}/containerization`;
export const DISCOVERY_RESOLVER = `${APPLE_PREFIX}.${DISCOVERY_DOMAIN}`;
export const LEGACY_RESOLVER = `${APPLE_PREFIX}.${NEX_DOMAIN}`;
export const DNS_HOST = "127.0.0.1";
export const DNS_PORTS = [53535, 53536, 53537, 53538, 53539, 53540, 53541, 53542, 53543, 53544];

export const resolverContents = (port: number) =>
  `nameserver ${DNS_HOST}\nport ${port}\nsearch_order 1\n`;

export interface ResolverConfig {
  nameservers: string[];
  port: number | null;
  domain: string | null;
  searchOrder: number | null;
}

export function parseResolver(text: string): ResolverConfig {
  const config: ResolverConfig = { nameservers: [], port: null, domain: null, searchOrder: null };
  for (const line of text.split("\n")) {
    const [key, value] = line.replace(/#.*/, "").trim().split(/\s+/);
    if (!key || !value) continue;
    if (key === "nameserver") config.nameservers.push(value);
    else if (key === "port") config.port = Number(value) || null;
    else if (key === "domain") config.domain = value;
    else if (key === "search_order") config.searchOrder = Number(value);
  }
  return config;
}

export function resolverMatches(text: string | null, port: number | null): boolean {
  if (text === null || port === null) return false;
  const config = parseResolver(text);
  return (
    config.nameservers.length === 1 &&
    config.nameservers[0] === DNS_HOST &&
    config.port === port &&
    config.searchOrder === 1 &&
    (config.domain === null || config.domain === NEX_DOMAIN)
  );
}

export interface ResolverFiles {
  nex: string | null;
  discovery: boolean;
  legacy: boolean;
}

// Apple's own `.nex` domain answers its aliases ahead of Nex's resolver, so it must be gone.
export const addressesRegistered = (files: ResolverFiles, port: number | null) =>
  resolverMatches(files.nex, port) && files.discovery && !files.legacy;

export const discoveryCommands = (files: ResolverFiles, containerBinary: string): string[][] =>
  files.discovery ? [] : [[containerBinary, "system", "dns", "create", DISCOVERY_DOMAIN]];

export function registerCommands(
  staged: string,
  files: ResolverFiles,
  containerBinary: string,
): string[][] {
  return [
    ...(files.legacy ? [[containerBinary, "system", "dns", "delete", NEX_DOMAIN]] : []),
    ...discoveryCommands(files, containerBinary),
    ["/bin/mkdir", "-p", RESOLVER_DIR],
    ["/usr/bin/install", "-m", "0644", staged, NEX_RESOLVER],
  ];
}

export function unregisterCommands(files: ResolverFiles): string[][] {
  const paths = [
    ...(files.nex !== null ? [NEX_RESOLVER] : []),
    ...(files.discovery ? [DISCOVERY_RESOLVER] : []),
    ...(files.legacy ? [LEGACY_RESOLVER] : []),
  ];
  return paths.length > 0 ? [["/bin/rm", "-f", ...paths]] : [];
}
