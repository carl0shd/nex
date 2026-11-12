import { readFile, stat } from "fs/promises";
import { posix, relative, resolve, sep } from "path";

export interface ProjectFiles {
  read: (path: string) => Promise<string | null>;
}

const MAX_BYTES = 512 * 1024;

export const repoPath = (...parts: string[]) => {
  const joined = posix.normalize(posix.join(...parts.filter(Boolean)));
  return joined === "." ? "" : joined.replace(/^\.\//, "").replace(/\/$/, "");
};

export function projectFiles(root: string): ProjectFiles {
  return {
    read: async (path) => {
      const absolute = resolve(root, path);
      const inside = relative(root, absolute);
      if (!inside || inside.startsWith(`..${sep}`) || inside === "..") return null;
      try {
        if ((await stat(absolute)).size > MAX_BYTES) return null;
        return await readFile(absolute, "utf8");
      } catch {
        return null;
      }
    },
  };
}

export function memoryFiles(files: Readonly<Record<string, string>>): ProjectFiles {
  return { read: async (path) => files[repoPath(path)] ?? null };
}
