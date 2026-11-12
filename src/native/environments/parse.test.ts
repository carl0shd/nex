import { describe, expect, it } from "vite-plus/test";
import { nexLabels } from "@native/environments/labels";
import {
  adminAppleScript,
  compareVersions,
  friendlyError,
  gbFromBytes,
  memoryChoices,
  parseContainers,
  parseIds,
  parseImageNames,
  parseImages,
  parseLines,
  parseMemoryUsage,
  parseSystemRunning,
  parseVersion,
  parseImageConfig,
  parseVolumes,
  unsupportedReason,
} from "@native/environments/parse";

describe("versions", () => {
  it("compares dotted versions numerically", () => {
    expect(compareVersions("1.7.1", "1.7.0")).toBe(1);
    expect(compareVersions("1.10.0", "1.9.9")).toBe(1);
    expect(compareVersions("1.7", "1.7.0")).toBe(0);
    expect(compareVersions("1.6.9", "1.7.0")).toBe(-1);
  });

  it("reads the version from the CLI banner", () => {
    expect(parseVersion("container CLI version 1.7.1 (build: release, commit: a15b460)")).toBe(
      "1.7.1",
    );
    expect(parseVersion("command not found")).toBeNull();
  });
});

describe("unsupportedReason", () => {
  it("needs Apple silicon first, then macOS 26", () => {
    expect(unsupportedReason("26.6.2", true)).toBeNull();
    expect(unsupportedReason("27.0", true)).toBeNull();
    expect(unsupportedReason("15.6", true)).toBe("macos");
    expect(unsupportedReason("26.1", false)).toBe("arch");
    expect(unsupportedReason("", true)).toBe("macos");
  });
});

const CONTAINERS = JSON.stringify([
  {
    id: "buildkit",
    configuration: {
      id: "buildkit",
      labels: { "com.apple.container.resource.role": "builder" },
    },
    status: {
      state: "running",
      networks: [{ hostname: "buildkit", ipv4Address: "192.168.64.2/24", network: "default" }],
    },
  },
  {
    id: "nex-check-1",
    configuration: { id: "nex-check-1", labels: { nex: "1", "nex.check": "1" } },
    status: { state: "stopped", networks: [] },
  },
]);

describe("parseContainers", () => {
  it("reads id, state, labels and the first IPv4 address", () => {
    expect(parseContainers(CONTAINERS)).toEqual([
      {
        id: "buildkit",
        state: "running",
        labels: { "com.apple.container.resource.role": "builder" },
        ip: "192.168.64.2",
      },
      { id: "nex-check-1", state: "stopped", labels: { nex: "1", "nex.check": "1" }, ip: null },
    ]);
  });

  it("tolerates junk", () => {
    expect(parseContainers("Error: no such container")).toEqual([]);
  });
});

describe("other listings", () => {
  it("reads volume names and labels", () => {
    const json = JSON.stringify([
      { id: "db", configuration: { name: "db", labels: { nex: "1" }, sizeInBytes: 1 } },
    ]);
    expect(parseVolumes(json)).toEqual([
      { name: "db", labels: { nex: "1" }, source: null, sizeInBytes: 1 },
    ]);
  });

  it("reads the entrypoint and working directory of the image’s arm64 variant", () => {
    const variant = (architecture: string, config: Record<string, unknown>) => ({
      platform: { os: "linux", architecture },
      config: { config },
    });
    const json = JSON.stringify([
      {
        variants: [
          variant("amd64", { Entrypoint: ["/amd"] }),
          variant("arm64", { Entrypoint: ["/entrypoint"], WorkingDir: "/app" }),
        ],
      },
    ]);
    expect(parseImageConfig(json)).toEqual({ entrypoint: ["/entrypoint"], workdir: "/app" });
    expect(parseImageConfig(JSON.stringify([{ variants: [variant("arm64", {})] }]))).toEqual({
      entrypoint: [],
      workdir: null,
    });
    expect(parseImageConfig("Error: not found")).toEqual({ entrypoint: [], workdir: null });
  });

  it("maps memory use by container", () => {
    const json = JSON.stringify([
      { id: "a", memoryUsageBytes: 2236416, memoryLimitBytes: 268435456 },
      { id: "b", memoryUsageBytes: 104857600 },
    ]);
    expect(parseMemoryUsage(json)).toEqual(
      new Map([
        ["a", 2236416],
        ["b", 104857600],
      ]),
    );
  });

  it("reads image names, machine ids and quiet lines", () => {
    expect(
      parseImageNames('[{"configuration":{"name":"docker.io/library/nex-machine:1"}}]'),
    ).toEqual(["docker.io/library/nex-machine:1"]);
    expect(
      parseImages(
        JSON.stringify([
          {
            configuration: { name: "docker.io/library/nex-shop-web:abc" },
            variants: [{ config: { config: { Labels: { nex: "1", "nex.build": "x" } } } }],
          },
          { configuration: { name: "docker.io/library/alpine:3.20" }, variants: [{}] },
        ]),
      ),
    ).toEqual([
      { name: "docker.io/library/nex-shop-web:abc", labels: { nex: "1", "nex.build": "x" } },
      { name: "docker.io/library/alpine:3.20", labels: {} },
    ]);
    expect(parseIds('[{"id":"nex","status":"running"}]')).toEqual(["nex"]);
    expect(parseLines("nex\n test \n\n")).toEqual(["nex", "test"]);
  });

  it("labels everything Nex creates", () => {
    expect(nexLabels({ "nex.task": "t1" })).toEqual(["--label", "nex=1", "--label", "nex.task=t1"]);
  });
});

describe("parseSystemRunning", () => {
  it("is true only for a running apiserver", () => {
    expect(parseSystemRunning('{"status":"running"}')).toBe(true);
    expect(parseSystemRunning('{"status":"stopped"}')).toBe(false);
    expect(parseSystemRunning("apiserver is not running")).toBe(false);
  });
});

describe("memory", () => {
  it("rounds bytes to tenths of a GB", () => {
    expect(gbFromBytes(8589934592)).toBe(8);
    expect(gbFromBytes(6442450944)).toBe(6);
  });

  it("offers only what fits in three quarters of the Mac", () => {
    expect(memoryChoices(32)).toEqual([4, 8, 12, 16]);
    expect(memoryChoices(16)).toEqual([4, 8, 12]);
    expect(memoryChoices(8)).toEqual([4]);
    expect(memoryChoices(4)).toEqual([4]);
  });
});

describe("adminAppleScript", () => {
  it("quotes every argument for the shell and chains commands", () => {
    expect(
      adminAppleScript([
        ["/usr/sbin/installer", "-pkg", "/tmp/it's.pkg"],
        ["/usr/local/bin/container", "system", "dns", "create", "nex"],
      ]),
    ).toBe(
      `do shell script "'/usr/sbin/installer' '-pkg' '/tmp/it'\\\\''s.pkg' && '/usr/local/bin/container' 'system' 'dns' 'create' 'nex'" with administrator privileges`,
    );
  });

  it("escapes double quotes for AppleScript", () => {
    expect(adminAppleScript([["/bin/echo", 'a "b"']])).toBe(
      `do shell script "'/bin/echo' 'a \\"b\\"'" with administrator privileges`,
    );
  });
});

describe("friendlyError", () => {
  it("explains a closed password dialog", () => {
    expect(friendlyError("execution error: User canceled. (-128)")).toBe(
      "The password dialog was closed.",
    );
  });

  it("keeps the last line without the Error prefix", () => {
    expect(friendlyError("building\nError: failed to fetch image\n")).toBe("failed to fetch image");
    expect(friendlyError("")).toBe("Something went wrong. The log has the details.");
  });

  it("reads the description out of a Cocoa error", () => {
    const raw = `#1 fetching\nError: unknown: "Error Domain=NSCocoaErrorDomain Code=4 "“${"ab".repeat(32)}” couldn’t be moved." UserInfo={NSUserStringVariant=(\n    Move\n), NSFilePath=/x}"`;
    expect(friendlyError(raw)).toBe("“abababab…” couldn’t be moved.");
  });
});
