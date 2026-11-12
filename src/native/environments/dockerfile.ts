export interface DockerStage {
  from: string;
  name?: string;
}

export interface DockerCopy {
  sources: string[];
  dest: string;
}

export interface Dockerfile {
  stages: DockerStage[];
  sources: string[];
  copies: DockerCopy[];
  cmd?: string;
}

function instructions(text: string): { keyword: string; args: string }[] {
  const joined = text
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("#"))
    .join("\n")
    .replace(/\\[ \t]*\n/g, " ");
  return joined
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const space = line.search(/\s/);
      return space === -1
        ? { keyword: line.toUpperCase(), args: "" }
        : { keyword: line.slice(0, space).toUpperCase(), args: line.slice(space + 1).trim() };
    });
}

function words(args: string): string[] {
  if (args.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(args);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return [];
    }
  }
  return args.split(/\s+/).filter(Boolean);
}

const isUrl = (source: string) => /^[a-z][a-z0-9+.-]*:\/\//i.test(source);

function copyFromContext(args: string): DockerCopy | null {
  const flags = args.match(/^(?:--\S+\s+)*/)?.[0] ?? "";
  if (/--from=/.test(flags)) return null;
  const parts = words(args.slice(flags.length));
  return {
    sources: parts.slice(0, -1).filter((source) => !isUrl(source) && !source.startsWith("<<")),
    dest: parts.at(-1) ?? "",
  };
}

const commandText = (args: string) => (args.startsWith("[") ? words(args).join(" ") : args);

function bindSources(args: string): string[] {
  return [...args.matchAll(/--mount=(\S+)/g)].flatMap((match) => {
    const options = Object.fromEntries(
      (match[1] ?? "").split(",").map((pair) => {
        const [key = "", value = ""] = pair.split("=");
        return [key, value];
      }),
    );
    if (options.type !== "bind" || options.from) return [];
    return [options.source ?? options.src ?? "."];
  });
}

export function parseDockerfile(text: string): Dockerfile {
  const stages: DockerStage[] = [];
  const sources: string[] = [];
  const copies: DockerCopy[] = [];
  let cmd: string | undefined;
  for (const { keyword, args } of instructions(text)) {
    if (keyword === "FROM") {
      const parts = args.split(/\s+/).filter((word) => !word.startsWith("--"));
      const name = parts[1]?.toUpperCase() === "AS" ? parts[2] : undefined;
      stages.push({ from: parts[0] ?? "", ...(name ? { name } : {}) });
    } else if (keyword === "COPY" || keyword === "ADD") {
      const copy = copyFromContext(args);
      if (copy) {
        sources.push(...copy.sources);
        copies.push(copy);
      }
    } else if (keyword === "RUN") {
      sources.push(...bindSources(args));
    } else if (keyword === "CMD") {
      cmd = commandText(args);
    }
  }
  return { stages, sources: [...new Set(sources)], copies, ...(cmd ? { cmd } : {}) };
}

export const hasStage = (dockerfile: Dockerfile, target: string) =>
  dockerfile.stages.some((stage) => stage.name?.toLowerCase() === target.toLowerCase());
