import { describe, expect, it } from "vite-plus/test";
import type { EnvServiceDef, ProjectEnvironment } from "@native/db/types";
import {
  environmentProblems,
  imageRepository,
  joinCommand,
  knownImage,
  orderServices,
  serviceAddress,
  serviceAliases,
  slugName,
  splitCommand,
} from "@native/environments/definition";

const service = (overrides: Partial<EnvServiceDef>): EnvServiceDef => ({
  name: "web",
  kind: "app",
  image: "node:22-alpine",
  ports: [],
  env: {},
  dependsOn: [],
  memoryMb: 1024,
  ...overrides,
});

const environment = (services: EnvServiceDef[]): ProjectEnvironment => ({
  services,
  source: "detected",
  detectedFrom: [],
  warnings: [],
});

describe("images", () => {
  it("finds the repository without registry tag or digest", () => {
    expect(imageRepository("docker.io/library/postgres:16-alpine")).toBe(
      "docker.io/library/postgres",
    );
    expect(imageRepository("localhost:5000/team/app:1")).toBe("localhost:5000/team/app");
    expect(imageRepository("redis@sha256:abc")).toBe("redis");
  });

  it("knows the data stores", () => {
    expect(knownImage("postgis/postgis:16")?.store).toBe("postgres");
    expect(knownImage("bitnami/redis:7")?.store).toBe("redis");
    expect(knownImage("mysql:8.4")?.dataPath).toBe("/var/lib/mysql");
    expect(knownImage("nginx:alpine")).toBeNull();
  });
});

describe("names and addresses", () => {
  it("turns any name into a DNS label", () => {
    expect(slugName("Celery_Worker")).toBe("celery-worker");
    expect(slugName("--api--")).toBe("api");
  });

  it("gives the first app with a port the task's own address", () => {
    const env = environment([
      service({ name: "db", kind: "image", image: "postgres:16" }),
      service({ name: "api", ports: [8000] }),
      service({ name: "web", ports: [5173] }),
    ]);
    const [db, api, web] = env.services as [EnvServiceDef, EnvServiceDef, EnvServiceDef];
    expect(serviceAliases(env, api, "fix-login")).toEqual(["api.fix-login.nex", "fix-login.nex"]);
    expect(serviceAliases(env, web, "fix-login")).toEqual(["web.fix-login.nex"]);
    expect(serviceAddress(env, api, "fix-login")).toBe("fix-login.nex");
    expect(serviceAddress(env, web, "fix-login")).toBe("web.fix-login.nex");
    expect(serviceAddress(env, db, "fix-login")).toBeNull();
  });
});

describe("orderServices", () => {
  it("starts dependencies first and keeps the rest in order", () => {
    const ordered = orderServices([
      service({ name: "web", dependsOn: ["api"] }),
      service({ name: "api", dependsOn: ["db", "redis"] }),
      service({ name: "redis" }),
      service({ name: "db" }),
    ]);
    expect(ordered.map((item) => item.name)).toEqual(["db", "redis", "api", "web"]);
  });

  it("refuses cycles and unknown services", () => {
    expect(() =>
      orderServices([
        service({ name: "a", dependsOn: ["b"] }),
        service({ name: "b", dependsOn: ["a"] }),
      ]),
    ).toThrow("a → b → a depend on each other.");
    expect(() => orderServices([service({ name: "a", dependsOn: ["ghost"] })])).toThrow(
      "a depends on ghost, which isn’t a service.",
    );
  });
});

describe("environmentProblems", () => {
  it("lists what keeps an environment from running", () => {
    expect(
      environmentProblems(
        environment([
          service({ name: "Web" }),
          service({ name: "api", image: " " }),
          service({ name: "api", ports: [70_000] }),
          service({ name: "worker", kind: "build", image: "" }),
          service({
            name: "django",
            kind: "build",
            image: "",
            build: { context: "", dockerfile: "Dockerfile" },
          }),
        ]),
      ),
    ).toEqual([
      "Web needs a name of lowercase letters, numbers and dashes.",
      "api needs an image.",
      "Two services are called api.",
      "api has a port outside 1–65535.",
      "worker needs a Dockerfile.",
    ]);
    expect(environmentProblems(environment([service({})]))).toEqual([]);
  });
});

describe("commands", () => {
  it("splits like a shell without running one", () => {
    expect(splitCommand(`redis-server --appendonly yes --save ""`)).toEqual([
      "redis-server",
      "--appendonly",
      "yes",
      "--save",
      "",
    ]);
    expect(splitCommand(`sh -c 'echo "$HOME"' a\\ b`)).toEqual(["sh", "-c", 'echo "$HOME"', "a b"]);
  });

  it("joins words back with quotes only where needed", () => {
    expect(joinCommand(["pnpm", "run", "dev"])).toBe("pnpm run dev");
    expect(joinCommand(["sh", "-c", "it's here"])).toBe(`sh -c 'it'\\''s here'`);
  });
});
