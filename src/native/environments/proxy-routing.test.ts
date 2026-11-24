import { describe, expect, it } from "vite-plus/test";
import type { EnvServiceDef, ProjectEnvironment } from "@native/db/types";
import {
  composeOrigin,
  forwardedHeaders,
  hostPorts,
  isLoopback,
  isRoute,
  listeningPorts,
  looksLikeHttp,
  parseTaskHost,
  proxyTask,
  requestHead,
  returnedHeaders,
  routeRequest,
  speaksRaw,
  type ProxyTable,
  type Route,
} from "@native/environments/proxy-routing";

const service = (overrides: Partial<EnvServiceDef>): EnvServiceDef => ({
  name: "web",
  kind: "build",
  image: "",
  ports: [],
  env: {},
  dependsOn: [],
  memoryMb: 512,
  ...overrides,
});

const env: ProjectEnvironment = {
  source: "detected",
  detectedFrom: [],
  warnings: [],
  services: [
    service({ name: "db", kind: "image", image: "postgres:16", data: { path: "/data" } }),
    service({ name: "api", ports: [8000, 5678] }),
    service({ name: "hocuspocus", ports: [1234] }),
    service({ name: "oberon-web", ports: [80], hostPorts: [{ host: 5173, container: 80 }] }),
  ],
};

const table = (viewing: string | null = null): ProxyTable => ({
  tasks: [proxyTask(env, "taska", 1, false), proxyTask(env, "taskb", 2, false)],
  viewing,
  entryPort: 1355,
});

function routed(result: ReturnType<typeof routeRequest>): Route {
  if (!isRoute(result)) throw new Error(`no route: ${result.miss}`);
  return result;
}

const summary = (result: ReturnType<typeof routeRequest>) => {
  const route = routed(result);
  return [route.task.slug, route.service.name, route.port, route.via];
};

describe("task hosts", () => {
  it("reads the task and service from a .nex or .localhost name", () => {
    expect(parseTaskHost("taska.localhost:1355")).toEqual({
      slug: "taska",
      service: null,
      domain: "localhost",
    });
    expect(parseTaskHost("API.TaskA.localhost")).toMatchObject({ slug: "taska", service: "api" });
    expect(parseTaskHost("api.taska.nex")).toEqual({
      slug: "taska",
      service: "api",
      domain: "nex",
    });
    expect(parseTaskHost("taska.nex.")).toMatchObject({ slug: "taska", domain: "nex" });
    expect(parseTaskHost("annex")).toBeNull();
    expect(parseTaskHost("localhost:8000")).toBeNull();
    expect(parseTaskHost("a.b.c.localhost")).toBeNull();
    expect(parseTaskHost("example.com")).toBeNull();
    expect(parseTaskHost(undefined)).toBeNull();
  });

  it("listens on every port compose published, once", () => {
    expect(hostPorts(table().tasks)).toEqual([1234, 5173, 5678, 8000]);
    expect(hostPorts([{ ...proxyTask(env, "taska", 1, true) }])).toEqual([]);
  });
});

describe("routing", () => {
  it("routes the entry port by Host to the service's container port", () => {
    expect(
      summary(routeRequest(table(), { listenPort: 1355, host: "taska.localhost:1355" })),
    ).toEqual(["taska", "oberon-web", 80, "address"]);
    expect(
      summary(routeRequest(table(), { listenPort: 1355, host: "api.taskb.localhost:1355" })),
    ).toEqual(["taskb", "api", 8000, "address"]);
    expect(routeRequest(table(), { listenPort: 1355, host: "localhost:1355" })).toEqual({
      miss: "no-task",
    });
    expect(routeRequest(table(), { listenPort: 1355, host: "gone.localhost:1355" })).toEqual({
      miss: "no-task",
      slug: "gone",
    });
  });

  it("routes a host port by the page that called it", () => {
    const fromA = {
      listenPort: 8000,
      host: "localhost:8000",
      origin: "http://taska.localhost:1355",
    };
    expect(summary(routeRequest(table(), fromA))).toEqual(["taska", "api", 8000, "origin"]);
    const fromB = { listenPort: 1234, origin: "http://oberon-web.taskb.localhost:1355" };
    expect(summary(routeRequest(table(), fromB))).toEqual(["taskb", "hocuspocus", 1234, "origin"]);
    const referer = { listenPort: 8000, referer: "http://taskb.localhost:1355/deals?id=1" };
    expect(summary(routeRequest(table(), referer))).toEqual(["taskb", "api", 8000, "origin"]);
  });

  it("maps a published port to the container port behind it", () => {
    expect(summary(routeRequest(table(), { listenPort: 5173, host: "localhost:5173" }))).toEqual([
      "taskb",
      "oberon-web",
      80,
      "fallback",
    ]);
  });

  it("falls back to the task you're viewing, then the newest", () => {
    const typed = { listenPort: 8000, host: "localhost:8000" };
    expect(routed(routeRequest(table("taska"), typed)).task.slug).toBe("taska");
    expect(routed(routeRequest(table(), typed)).task.slug).toBe("taskb");
    const paused = {
      ...table("taska"),
      tasks: [proxyTask(env, "taska", 3, true), table().tasks[1]!],
    };
    expect(routed(routeRequest(paused, typed)).task.slug).toBe("taskb");
    expect(routeRequest({ ...table(), tasks: [] }, typed)).toEqual({ miss: "no-task" });
  });

  it("routes a task's own host on a published port", () => {
    expect(
      summary(routeRequest(table(), { listenPort: 8000, host: "api.taska.localhost:8000" })),
    ).toEqual(["taska", "api", 8000, "address"]);
  });

  it("routes .nex names exactly like .localhost ones", () => {
    const nex = { ...table(), entryPort: 80 };
    expect(summary(routeRequest(nex, { listenPort: 80, host: "taska.nex" }))).toEqual([
      "taska",
      "oberon-web",
      80,
      "address",
    ]);
    expect(summary(routeRequest(nex, { listenPort: 80, host: "api.taskb.nex" }))).toEqual([
      "taskb",
      "api",
      8000,
      "address",
    ]);
    const fromNex = { listenPort: 8000, origin: "http://taska.nex" };
    expect(summary(routeRequest(nex, fromNex))).toEqual(["taska", "api", 8000, "origin"]);
  });

  it("answers the short name of a service and its full one", () => {
    const short: ProjectEnvironment = {
      ...env,
      services: [
        service({ name: "triton-django", ports: [8000] }),
        service({ name: "triton-flower", ports: [5555] }),
        service({ name: "oberon-web", ports: [80] }),
      ],
    };
    const tasks: ProxyTable = {
      tasks: [proxyTask(short, "t", 1, false)],
      viewing: null,
      entryPort: 80,
    };
    expect(tasks.tasks[0]?.services.map((item) => item.label)).toEqual([
      "django",
      "flower",
      "oberon-web",
    ]);
    expect(summary(routeRequest(tasks, { listenPort: 80, host: "django.t.nex" }))).toEqual([
      "t",
      "triton-django",
      8000,
      "address",
    ]);
    expect(routed(routeRequest(tasks, { listenPort: 80, host: "triton-flower.t.nex" })).port).toBe(
      5555,
    );
  });

  it("serves a published port that is also the entry port", () => {
    const front: ProjectEnvironment = { ...env, services: [service({ name: "web", ports: [80] })] };
    const tasks: ProxyTable = {
      tasks: [proxyTask(front, "t", 1, false)],
      viewing: null,
      entryPort: 80,
    };
    expect(summary(routeRequest(tasks, { listenPort: 80, host: "localhost" }))).toEqual([
      "t",
      "web",
      80,
      "fallback",
    ]);
    expect(routeRequest(table(), { listenPort: 1355, host: "localhost:1355" })).toEqual({
      miss: "no-task",
    });
  });

  it("says when a task is paused", () => {
    const paused = { ...table(), tasks: [proxyTask(env, "taska", 1, true)] };
    expect(routeRequest(paused, { listenPort: 1355, host: "taska.localhost:1355" })).toEqual({
      miss: "paused",
      slug: "taska",
    });
  });
});

describe("header rewrites", () => {
  const request = {
    host: "localhost:8000",
    origin: "http://taska.localhost:1355",
    referer: "http://taska.localhost:1355/deals?id=1",
    connection: "keep-alive",
    cookie: "sessionid=abc",
  };

  it("shows the backend the origin compose used", () => {
    expect(composeOrigin(table(), "http://taska.localhost:1355")).toBe("http://localhost:5173");
    expect(composeOrigin(table(), "http://api.taska.localhost:1355")).toBe("http://localhost:8000");
    expect(composeOrigin(table(), "http://example.com")).toBeUndefined();
    const route = routed(routeRequest(table(), { listenPort: 8000, ...request }));
    const forwarded = forwardedHeaders(table(), route, request);
    expect(forwarded.headers).toEqual({
      host: "localhost:8000",
      origin: "http://localhost:5173",
      referer: "http://localhost:5173/deals?id=1",
      cookie: "sessionid=abc",
    });
    expect(forwarded.origin).toEqual({
      real: "http://taska.localhost:1355",
      compose: "http://localhost:5173",
    });
  });

  it("gives the frontend its compose host", () => {
    const route = routed(routeRequest(table(), { listenPort: 1355, host: "taska.localhost:1355" }));
    expect(forwardedHeaders(table(), route, { host: "taska.localhost:1355" }).headers).toEqual({
      host: "localhost:5173",
    });
  });

  it("keeps the upgrade headers of a WebSocket", () => {
    const route = routed(routeRequest(table(), { listenPort: 1234, origin: request.origin }));
    const ws = { connection: "Upgrade", upgrade: "websocket", origin: request.origin };
    expect(forwardedHeaders(table(), route, ws, true).headers).toMatchObject({
      connection: "Upgrade",
      upgrade: "websocket",
      host: "localhost:1234",
      origin: "http://localhost:5173",
    });
  });

  it("answers CORS for the real page and keeps redirects on the task", () => {
    const fromPage = routed(routeRequest(table(), { listenPort: 8000, ...request }));
    const forwarded = forwardedHeaders(table(), fromPage, request);
    expect(
      returnedHeaders(table(), fromPage, forwarded, {
        "access-control-allow-origin": "http://localhost:5173",
        location: "http://localhost:8000/login",
        connection: "keep-alive",
      }),
    ).toEqual({
      "access-control-allow-origin": "http://taska.localhost:1355",
      location: "http://localhost:8000/login",
    });
    const direct = routed(routeRequest(table(), { listenPort: 1355, host: "api.taska.localhost" }));
    const plain = forwardedHeaders(table(), direct, { host: "api.taska.localhost:1355" });
    expect(
      returnedHeaders(table(), direct, plain, {
        location: "http://localhost:5173/welcome?next=1",
        "access-control-allow-origin": "*",
      }),
    ).toEqual({
      location: "http://taska.localhost:1355/welcome?next=1",
      "access-control-allow-origin": "*",
    });
    expect(returnedHeaders(table(), direct, plain, { location: "/relative" }).location).toBe(
      "/relative",
    );
  });

  it("keeps redirects on the .nex address a request came in on", () => {
    const nex = { ...table(), entryPort: 80 };
    const direct = routed(routeRequest(nex, { listenPort: 80, host: "api.taska.nex" }));
    const plain = forwardedHeaders(nex, direct, { host: "api.taska.nex" });
    expect(plain.headers.host).toBe("localhost:8000");
    expect(
      returnedHeaders(nex, direct, plain, { location: "http://localhost:5173/welcome" }).location,
    ).toBe("http://taska.nex/welcome");
    expect(
      returnedHeaders(nex, direct, plain, { location: "http://localhost:8000/admin/" }).location,
    ).toBe("http://api.taska.nex/admin/");
  });

  it("writes a request head for an upgrade", () => {
    expect(requestHead("GET", "/ws", { host: "localhost:1234", "set-x": ["a", "b"] })).toBe(
      "GET /ws HTTP/1.1\r\nhost: localhost:1234\r\nset-x: a\r\nset-x: b\r\n\r\n",
    );
  });
});

describe("data ports", () => {
  const data: ProjectEnvironment = {
    ...env,
    services: [
      service({
        name: "postgres",
        kind: "image",
        image: "postgres:16",
        ports: [5432],
        data: { path: "/data" },
      }),
      service({ name: "mailpit", kind: "image", image: "axllent/mailpit", ports: [8025, 1025] }),
      service({ name: "web", ports: [5173] }),
    ],
  };
  const tasks = (viewing: string | null, pausedB = false): ProxyTable => ({
    tasks: [proxyTask(data, "taska", 1, false), proxyTask(data, "taskb", 2, pausedB)],
    viewing,
    entryPort: 80,
  });

  it("pipes database and mail ports raw, web ports through HTTP", () => {
    expect(speaksRaw(tasks(null), 5432)).toBe(true);
    expect(speaksRaw(tasks(null), 1025)).toBe(true);
    expect(speaksRaw(tasks(null), 8025)).toBe(false);
    expect(speaksRaw(tasks(null), 5173)).toBe(false);
    expect(speaksRaw(tasks(null), 9999)).toBe(false);
  });

  it("sends them to the task you're viewing, else the newest running one", () => {
    const raw = (table: ProxyTable) => routed(routeRequest(table, { listenPort: 5432 })).task.slug;
    expect(raw(tasks("taska"))).toBe("taska");
    expect(raw(tasks("taskb"))).toBe("taskb");
    expect(raw(tasks(null))).toBe("taskb");
    expect(raw(tasks("taskb", true))).toBe("taska");
    expect(hostPorts(tasks(null).tasks)).toEqual([1025, 5173, 5432, 8025]);
  });
});

describe("ports in use", () => {
  it("lets only this Mac in", () => {
    expect(isLoopback("127.0.0.1")).toBe(true);
    expect(isLoopback("127.4.5.6")).toBe(true);
    expect(isLoopback("::1")).toBe(true);
    expect(isLoopback("::ffff:127.0.0.1")).toBe(true);
    expect(isLoopback("192.168.2.10")).toBe(false);
    expect(isLoopback("::ffff:192.168.2.10")).toBe(false);
    expect(isLoopback("fe80::1")).toBe(false);
    expect(isLoopback(undefined)).toBe(false);
  });

  it("finds the listeners of other apps", () => {
    const output = [
      "p100",
      "f12",
      "n127.0.0.1:8000",
      "f13",
      "n[::1]:8000",
      "p200",
      "f4",
      "n*:1234",
    ];
    expect(listeningPorts(output.join("\n"), 100)).toEqual([1234]);
  });

  it("tells HTTP from other protocols", () => {
    expect(looksLikeHttp(Buffer.from("GET / HTTP/1.1\r\n"))).toBe(true);
    expect(looksLikeHttp(Buffer.from([0x16, 0x03, 0x01]))).toBe(false);
  });
});
