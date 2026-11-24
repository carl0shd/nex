import { describe, expect, it } from "vite-plus/test";
import {
  addressesRegistered,
  parseResolver,
  registerCommands,
  resolverContents,
  resolverMatches,
  unregisterCommands,
} from "@native/environments/resolver-file";

const APPLE = "domain nex\nsearch nex\nnameserver 127.0.0.1\nport 2053\n";
const BINARY = "/usr/local/bin/container";

describe("resolver file", () => {
  it("points .nex at Nex's DNS on its port, ahead of Apple container's", () => {
    expect(resolverContents(53535)).toBe("nameserver 127.0.0.1\nport 53535\nsearch_order 1\n");
    expect(resolverMatches(resolverContents(53535), 53535)).toBe(true);
  });

  it("reads Apple container's file", () => {
    expect(parseResolver(APPLE)).toEqual({
      nameservers: ["127.0.0.1"],
      port: 2053,
      domain: "nex",
      searchOrder: null,
    });
  });

  it("is off when the file is missing, points elsewhere or Nex's DNS isn't listening", () => {
    expect(resolverMatches(null, 53535)).toBe(false);
    expect(resolverMatches(APPLE, 53535)).toBe(false);
    expect(resolverMatches(resolverContents(53536), 53535)).toBe(false);
    expect(resolverMatches(resolverContents(53535), null)).toBe(false);
    expect(resolverMatches("nameserver 127.0.0.1\nport 53535", 53535)).toBe(false);
    expect(resolverMatches("# nex\nnameserver 127.0.0.1\nport 53535\nsearch_order 1", 53535)).toBe(
      true,
    );
  });

  it("needs Apple's discovery domain, and Apple's own .nex gone so it can't answer first", () => {
    const nex = resolverContents(53535);
    expect(addressesRegistered({ nex, discovery: true, legacy: false }, 53535)).toBe(true);
    expect(addressesRegistered({ nex, discovery: false, legacy: false }, 53535)).toBe(false);
    expect(addressesRegistered({ nex, discovery: true, legacy: true }, 53535)).toBe(false);
  });

  it("moves Apple's domain to nexsvc and writes Nex's file in one admin batch", () => {
    expect(
      registerCommands("/tmp/nex", { nex: null, discovery: false, legacy: true }, BINARY),
    ).toEqual([
      [BINARY, "system", "dns", "delete", "nex"],
      [BINARY, "system", "dns", "create", "nexsvc"],
      ["/bin/mkdir", "-p", "/etc/resolver"],
      ["/usr/bin/install", "-m", "0644", "/tmp/nex", "/etc/resolver/nex"],
    ]);
    expect(
      registerCommands("/tmp/nex", { nex: APPLE, discovery: true, legacy: false }, BINARY),
    ).toHaveLength(2);
  });

  it("removes only the files that exist on uninstall", () => {
    expect(unregisterCommands({ nex: "x", discovery: true, legacy: true })).toEqual([
      [
        "/bin/rm",
        "-f",
        "/etc/resolver/nex",
        "/etc/resolver/containerization.nexsvc",
        "/etc/resolver/containerization.nex",
      ],
    ]);
    expect(unregisterCommands({ nex: null, discovery: false, legacy: false })).toEqual([]);
  });
});
