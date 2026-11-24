export interface EnvInstance {
  label: string;
  prefix: string;
  discoverySuffix: string;
  entryPort: number;
  ownsMacNetwork: boolean;
}

export const RELEASE_INSTANCE: EnvInstance = {
  label: "1",
  prefix: "nex",
  discoverySuffix: "",
  entryPort: 1355,
  ownsMacNetwork: true,
};

// Nex Dev shares Apple container with the installed app, so it keeps to its own names and ports
// and leaves `.nex`, port 80 and the tasks' host ports to the installed app.
export const DEV_INSTANCE: EnvInstance = {
  label: "dev",
  prefix: "nexdev",
  discoverySuffix: "-dev",
  entryPort: 1375,
  ownsMacNetwork: false,
};

let current = RELEASE_INSTANCE;

export const envInstance = (): EnvInstance => current;

export function selectEnvInstance(instance: EnvInstance): void {
  current = instance;
}
