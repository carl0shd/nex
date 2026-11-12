import { builderResources } from "@native/environments/containers";
import { projectKey } from "@native/environments/labels";
import { describe, expect, it } from "vite-plus/test";
import type { EnvServiceDef, ProjectEnvironment } from "@native/db/types";
import {
  buildHash,
  buildHashes,
  buildPlans,
  buildStep,
  builtImages,
  inputCandidates,
} from "@native/environments/build";
import { memoryFiles } from "@native/environments/project-files";

const DJANGO = { context: "triton", dockerfile: "triton/compose/local/django/Dockerfile" };

const service = (overrides: Partial<EnvServiceDef>): EnvServiceDef => ({
  name: "django",
  kind: "build",
  image: "",
  build: DJANGO,
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

const FILES = {
  "triton/compose/local/django/Dockerfile":
    "FROM python:3.12 AS python\nFROM python\nRUN --mount=type=bind,source=uv.lock,target=uv.lock uv sync\nCOPY ./compose/local/django/start /start\nCOPY . /app",
  "triton/uv.lock": "lock 1",
  "triton/pyproject.toml": "[project]",
  "triton/compose/local/django/start": "#!/bin/sh\nrunserver",
  "triton/app/views.py": "code",
};

describe("build plans", () => {
  it("builds services that share a build section once", () => {
    const env = environment([
      service({ name: "django" }),
      service({ name: "worker", command: "/start-celeryworker" }),
      service({
        name: "hocuspocus",
        build: {
          context: "triton",
          dockerfile: "triton/Dockerfile",
          target: "run",
          args: { A: "1" },
        },
      }),
      { ...service({ name: "db", kind: "image", image: "postgres:16" }), build: undefined },
    ]);
    const hashes = new Map([
      [JSON.stringify(["triton", DJANGO.dockerfile, "", []]), "aaa"],
      [JSON.stringify(["triton", "triton/Dockerfile", "run", [["A", "1"]]]), "bbb"],
    ]);
    const plans = buildPlans(env, { projectSlug: "meridian", projectPath: "/code/m", hashes });
    expect(plans.map((plan) => [plan.tag, plan.services])).toEqual([
      ["nex-meridian-django:aaa", ["django", "worker"]],
      ["nex-meridian-hocuspocus:bbb", ["hocuspocus"]],
    ]);
    expect(plans[1]?.args).toEqual([
      "build",
      "--progress",
      "plain",
      "--tag",
      "nex-meridian-hocuspocus:bbb",
      "--label",
      "nex=1",
      "--label",
      `nex.project=${projectKey("/code/m")}`,
      "--label",
      `nex.build=${plans[1]?.slot}`,
      "--file",
      "/code/m/triton/Dockerfile",
      "--target",
      "run",
      "--build-arg",
      "A=1",
      "/code/m/triton",
    ]);
    expect(builtImages(plans)).toEqual({
      django: "nex-meridian-django:aaa",
      worker: "nex-meridian-django:aaa",
      hocuspocus: "nex-meridian-hocuspocus:bbb",
    });
  });

  it("hashes the Dockerfile and the manifests it copies, not the code", async () => {
    const build = DJANGO;
    expect(inputCandidates(build, ["./hocuspocus/package*.json"])).toEqual([
      "triton/hocuspocus/package-lock.json",
      "triton/hocuspocus/package.json",
    ]);
    const base = await buildHash(memoryFiles(FILES), build, "/code/m");
    expect(base).toMatch(/^[0-9a-f]{12}$/);
    const same = { ...FILES, "triton/app/views.py": "edited" };
    expect(await buildHash(memoryFiles(same), build, "/code/m")).toBe(base);
    for (const [path, text] of Object.entries({
      "triton/uv.lock": "lock 2",
      "triton/compose/local/django/start": "#!/bin/sh\ngunicorn",
      "triton/compose/local/django/Dockerfile": `${FILES["triton/compose/local/django/Dockerfile"]}\nENV A=1`,
    })) {
      expect(await buildHash(memoryFiles({ ...FILES, [path]: text }), build, "/code/m")).not.toBe(
        base,
      );
    }
    expect(await buildHash(memoryFiles(FILES), { ...build, target: "x" }, "/code/m")).not.toBe(
      base,
    );
    expect(await buildHash(memoryFiles(FILES), build, "/code/other")).not.toBe(base);
    const hashes = await buildHashes(
      environment([service({}), service({ name: "worker" })]),
      memoryFiles(FILES),
      "/code/m",
    );
    expect([...hashes.values()]).toEqual([base]);
  });

  it("reads the current Dockerfile step from the build output", () => {
    expect(buildStep("#7 [node-build-stage 2/5] COPY ./hocuspocus/package*.json ./")).toBe(
      "node-build-stage 2/5 · COPY ./hocuspocus/package*.json ./",
    );
    expect(buildStep("#5 [linux/arm64 1/2] RUN mkdir -p /app")).toBe(
      "Step 1/2 · RUN mkdir -p /app",
    );
    expect(buildStep("#2 [internal] load build definition from Dockerfile")).toBeNull();
    expect(buildStep("#5 0.231 added 120 packages")).toBeNull();
    expect(buildStep(`#9 [python 3/4] RUN ${"x".repeat(200)}`)?.length).toBe(90);
    expect(
      buildStep(
        "#9 [python-build-stage 4/21] RUN --mount=type=cache,target=/root/.cache/uv uv sync",
      ),
    ).toBe("python-build-stage 4/21 · RUN uv sync");
    expect(buildStep("#4 transferring context: 280.54MB 12.3s")).toBe(
      "Sending project files · 281 MB",
    );
    expect(buildStep("#1 [resolver] fetching image...docker.io/library/node:24.14.1")).toBe(
      "Fetching node:24.14.1",
    );
    expect(buildStep("#5 sha256:2ad0 128.97MB / 203.07MB 4.3s")).toBe(
      "Downloading the base image · 129 of 203 MB",
    );
    expect(buildStep("#6 exporting to oci image format")).toBe("Saving the image");
  });
});

describe("builderResources", () => {
  it("gives the builder a third of the Mac's memory and all but two cores, within limits", () => {
    expect(builderResources(24 * 1024 ** 3, 10)).toEqual({ memoryGb: 8, cpus: 8 });
    expect(builderResources(8 * 1024 ** 3, 4)).toEqual({ memoryGb: 4, cpus: 2 });
  });
});
