import { describe, expect, it } from "vite-plus/test";
import type { EnvServiceDef, ProjectEnvironment } from "@native/db/types";
import {
  dataServices,
  prepareExecArgs,
  stepServices,
  stopArgs,
  stopOrder,
} from "@native/environments/env-steps";

const service = (overrides: Partial<EnvServiceDef>): EnvServiceDef => ({
  name: "web",
  kind: "app",
  image: "node:22-alpine",
  ports: [],
  env: {},
  dependsOn: [],
  memoryMb: 512,
  ...overrides,
});

const env: ProjectEnvironment = {
  services: [
    service({ name: "web", ports: [3000], dependsOn: ["db", "cache"] }),
    service({ name: "worker", dependsOn: ["db"] }),
    service({
      name: "db",
      kind: "image",
      image: "postgres:16-alpine",
      env: { POSTGRES_PASSWORD: "postgres" },
      data: { path: "/var/lib/postgresql/data" },
    }),
    service({ name: "cache", kind: "image", image: "redis:7", data: { path: "/data" } }),
  ],
  taskPrepare: [{ service: "web", command: "npx prisma migrate deploy" }],
  prepare: [{ service: "web", command: "npx prisma db seed" }],
  source: "detected",
  detectedFrom: [],
  warnings: [],
};

describe("environment steps", () => {
  it("stops the apps first, then the data stores in reverse dependency order", () => {
    expect(stopOrder(env)).toEqual({ apps: ["worker", "web"], stores: ["cache", "db"] });
    const [, , db, cache] = env.services as [
      EnvServiceDef,
      EnvServiceDef,
      EnvServiceDef,
      EnvServiceDef,
    ];
    expect(stopArgs(db, "nex-t-db", 180)).toEqual([
      "stop",
      "--time",
      "180",
      "--signal",
      "SIGINT",
      "nex-t-db",
    ]);
    expect(stopArgs(cache, "nex-t-cache", 180)).toEqual(["stop", "--time", "180", "nex-t-cache"]);
  });

  it("execs prepare steps through the image’s entrypoint", () => {
    expect(
      prepareExecArgs("nex-t-api", { entrypoint: ["/entrypoint"], workdir: "/app" }, "make seed"),
    ).toEqual(["exec", "--workdir", "/app", "nex-t-api", "/entrypoint", "sh", "-c", "make seed"]);
  });

  it("knows which services keep data and which run steps", () => {
    expect(dataServices(env).map((item) => item.name)).toEqual(["db", "cache"]);
    expect([...stepServices(env)]).toEqual(["web"]);
  });
});
