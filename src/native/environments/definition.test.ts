import { describe, expect, it } from "vite-plus/test";
import type { EnvServiceDef, ProjectEnvironment } from "@native/db/types";
import {
  environmentProblems,
  imageRepository,
  joinCommand,
  knownImage,
  orderServices,
  hostPortOf,
  mainService,
  originFor,
  portMappings,
  rawPort,
  serviceAddress,
  discoveryAlias,
  shortNames,
  slugName,
  splitCommand,
  webPort,
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

  it("gives the frontend the task's own address and every other service its own", () => {
    const env = environment([
      service({ name: "db", kind: "image", image: "postgres:16" }),
      service({ name: "api", ports: [8000] }),
      service({ name: "oberon-web", ports: [80], hostPorts: [{ host: 5173, container: 80 }] }),
    ]);
    const [db, api, web] = env.services as [EnvServiceDef, EnvServiceDef, EnvServiceDef];
    expect(mainService(env)?.name).toBe("oberon-web");
    expect(discoveryAlias(api, "fix-login")).toBe("api.fix-login.nexsvc");
    expect(serviceAddress(env, web, "fix-login")).toBe("fix-login.nex");
    expect(serviceAddress(env, api, "fix-login")).toBe("api.fix-login.nex");
    expect(serviceAddress(env, api, "fix-login", "localhost")).toBe("api.fix-login.localhost");
    expect(serviceAddress(env, db, "fix-login")).toBeNull();
    expect(originFor("fix-login.localhost", 1355)).toBe("http://fix-login.localhost:1355");
    expect(originFor("fix-login.localhost", 80)).toBe("http://fix-login.localhost");
  });

  it("drops a prefix several services share from their addresses", () => {
    const triton = [
      "oberon-web",
      "mailpit",
      "postgres",
      "triton-django",
      "triton-flower",
      "triton-celeryworker",
      "triton-celerybeat",
      "triton-hocuspocus",
    ];
    expect([...shortNames(triton).values()]).toEqual([
      "oberon-web",
      "mailpit",
      "postgres",
      "django",
      "flower",
      "celeryworker",
      "celerybeat",
      "hocuspocus",
    ]);
    const env = environment(triton.map((name) => service({ name, ports: [8000] })));
    const django = env.services[3] as EnvServiceDef;
    expect(serviceAddress(env, django, "fix-login")).toBe("django.fix-login.nex");
    expect(discoveryAlias(django, "fix-login")).toBe("triton-django.fix-login.nexsvc");
  });

  it("keeps the full name when the short one would clash or be empty", () => {
    expect([...shortNames(["triton-django", "triton-web", "django"]).values()]).toEqual([
      "triton-django",
      "web",
      "django",
    ]);
    expect([...shortNames(["app-meridian-api", "app-meridian-web", "app-docs"]).values()]).toEqual([
      "api",
      "web",
      "docs",
    ]);
    expect([...shortNames(["web", "web-api"]).values()]).toEqual(["web", "web-api"]);
    expect([...shortNames(["a--x", "a--y"]).values()]).toEqual(["x", "y"]);
  });

  it("pipes the ports of data stores and mail servers raw", () => {
    const db = service({ name: "db", kind: "image", image: "postgres:16", ports: [5432] });
    const mail = service({
      name: "mailpit",
      kind: "image",
      image: "axllent/mailpit",
      ports: [8025, 1025],
    });
    expect(rawPort(db, 5432)).toBe(true);
    expect(rawPort(mail, 1025)).toBe(true);
    expect(rawPort(mail, 8025)).toBe(false);
  });

  it("falls back to the first service you open", () => {
    const env = environment([
      service({ name: "worker", command: "celery worker", ports: [5555] }),
      service({ name: "api", ports: [8000] }),
    ]);
    expect(mainService(env)?.name).toBe("api");
  });

  it("remembers the host port compose published", () => {
    const web = service({ ports: [80, 9229], hostPorts: [{ host: 5173, container: 80 }] });
    expect(hostPortOf(web, 80)).toBe(5173);
    expect(hostPortOf(web, 9229)).toBe(9229);
    expect(portMappings(web)).toEqual([
      { host: 5173, container: 80 },
      { host: 9229, container: 9229 },
    ]);
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

describe("webPort", () => {
  it("skips mail, database and queue ports", () => {
    const ports = (list: number[]) => ({ ports: list }) as unknown as EnvServiceDef;
    expect(webPort(ports([1025, 8025]))).toBe(8025);
    expect(webPort(ports([5432]))).toBeUndefined();
    expect(webPort(ports([5173]))).toBe(5173);
  });
});
