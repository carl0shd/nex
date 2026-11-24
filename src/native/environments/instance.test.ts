import { afterEach, describe, expect, it } from "vite-plus/test";
import type { EnvServiceDef, ProjectEnvironment } from "@native/db/types";
import { searchDomain } from "./definition";
import { DEV_INSTANCE, RELEASE_INSTANCE, selectEnvInstance } from "./instance";
import { isNex, nexLabels } from "./labels";
import { agentEnvironmentNote, initialServices } from "./task-env-plan";
import { containerName, dataVolumeName } from "./translate";

const db: EnvServiceDef = {
  name: "db",
  kind: "image",
  image: "postgres:16",
  ports: [5432],
  hostPorts: [],
  env: {},
  envFiles: [],
  mounts: [],
  volumes: [],
  dependsOn: [],
} as unknown as EnvServiceDef;
const env = { services: [db] } as unknown as ProjectEnvironment;

describe("environment instances", () => {
  afterEach(() => selectEnvInstance(RELEASE_INSTANCE));

  it("keeps the installed app's names and labels", () => {
    expect(containerName("fix-login", "db")).toBe("nex-fix-login-db");
    expect(searchDomain("fix-login")).toBe("fix-login.nexsvc");
    expect(nexLabels()).toEqual(["--label", "nex=1"]);
  });

  it("gives Nex Dev its own names, labels and discovery domain", () => {
    selectEnvInstance(DEV_INSTANCE);
    expect(containerName("fix-login", "db")).toBe("nexdev-fix-login-db");
    expect(dataVolumeName("fix-login", "db")).toBe("nexdev-fix-login-db-data");
    expect(searchDomain("fix-login")).toBe("fix-login-dev.nexsvc");
    expect(nexLabels()).toEqual(["--label", "nex=dev"]);
    expect(isNex({ nex: "dev" })).toBe(true);
    expect(isNex({ nex: "1" })).toBe(false);
  });

  it("offers no localhost ports when host ports are left to the installed app", () => {
    const services = initialServices(env, "fix-login", "ready", {
      port: 1375,
      nex: false,
      hostPorts: false,
    });
    expect(services[0]?.localPort).toBeNull();
    expect(agentEnvironmentNote("fix-login", services, "container")).not.toContain(
      "localhost ports",
    );
  });
});
